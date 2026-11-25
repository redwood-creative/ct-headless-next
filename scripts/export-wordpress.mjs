#!/usr/bin/env node
/**
 * One-time export of the ClickTailors WordPress content into Markdown files.
 *
 *   node scripts/export-wordpress.mjs [graphql-url]
 *
 * - Posts  -> content/posts/<slug>.md
 * - Pages  -> content/pages/<slug>.md  (only the pages listed in PAGES_TO_EXPORT)
 * - Every image/video hosted on the WordPress droplet (directly or through the
 *   Jetpack i0.wp.com CDN) is downloaded into public/blog-media/<yyyy>/<mm>/ and
 *   the Markdown is rewritten to point at the local copy.
 *
 * Kept in the repo for reference; once the droplet is gone it cannot run again.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const GRAPHQL_URL = process.argv[2] || "https://wp.clicktailors.com/graphql";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const POSTS_DIR = path.join(ROOT, "content/posts");
const PAGES_DIR = path.join(ROOT, "content/pages");
const MEDIA_DIR = path.join(ROOT, "public/blog-media");
const MEDIA_URL = "/blog-media";

// WordPress pages that are real content. "home", "contact-us" and "404-2" are
// leftover Divi pages that the Next.js app already replaces.
const PAGES_TO_EXPORT = ["privacy-policy", "terms-of-service"];

// Links inside posts that pointed at old slugs.
const LINK_FIXES = {
	"/blog/posts/why-is-it-important-to-have-a-nice-looking-ui-website":
		"/blog/posts/beautiful-website",
};

const QUERY = /* GraphQL */ `
	{
		posts(first: 1000, where: { status: PUBLISH }) {
			nodes {
				slug
				title
				date
				modified
				excerpt
				content
				featuredImage { node { sourceUrl altText } }
				author { node { name firstName lastName avatar { url } } }
				categories { nodes { name } }
				tags { nodes { name } }
			}
		}
		pages(first: 100) {
			nodes { slug title modified content }
		}
	}
`;

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

const downloaded = new Map(); // original url -> local url

/** Map any droplet-hosted media URL to its original wp-content/uploads URL. */
function toOriginalUpload(url) {
	let u = url.replace(/&#0?38;|&amp;/g, "&").trim();
	if (u.startsWith("//")) u = "https:" + u;
	let parsed;
	try {
		parsed = new URL(u);
	} catch {
		return null;
	}
	// https://i0.wp.com/wp.clicktailors.com/wp-content/uploads/...?resize=...
	if (/^i\d\.wp\.com$/.test(parsed.hostname)) {
		const rest = parsed.pathname.replace(/^\//, "");
		if (!rest.startsWith("wp.clicktailors.com/")) return null;
		return "https://" + rest;
	}
	if (parsed.hostname === "wp.clicktailors.com" && parsed.pathname.includes("/wp-content/uploads/")) {
		return `https://${parsed.hostname}${parsed.pathname}`;
	}
	return null;
}

function safeFileName(name) {
	return decodeURIComponent(name)
		.normalize("NFKD")
		.replace(/[  \s]+/g, "-")
		.replace(/[^A-Za-z0-9._-]/g, "")
		.replace(/-+/g, "-");
}

async function download(url) {
	const original = toOriginalUpload(url);
	if (!original) return url;
	if (downloaded.has(original)) return downloaded.get(original);

	const match = original.match(/\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^/?#]+)$/);
	if (!match) return url;
	const [, year, month, rawName] = match;
	const fileName = safeFileName(rawName);
	const destDir = path.join(MEDIA_DIR, year, month);
	const dest = path.join(destDir, fileName);
	const localUrl = `${MEDIA_URL}/${year}/${month}/${fileName}`;

	// WordPress filenames can contain spaces / narrow no-break spaces; encode
	// each path segment exactly once.
	const fetchUrl = original
		.split("/")
		.map((seg, i) => (i < 3 ? seg : encodeURIComponent(decodeURIComponent(seg))))
		.join("/");

	await fs.mkdir(destDir, { recursive: true });
	try {
		await fs.access(dest);
	} catch {
		let res = await fetch(fetchUrl);
		if (!res.ok) {
			// Some uploads (e.g. macOS screen recordings) use U+202F instead of a space.
			const alt = fetchUrl.replace(/%20/g, "%E2%80%AF");
			res = await fetch(alt);
		}
		if (!res.ok) {
			console.warn(`  ! failed to download ${original} (${res.status}); keeping remote URL`);
			return url;
		}
		await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
		console.log(`  ↓ ${localUrl}`);
	}
	const finalUrl = fileName.toLowerCase().endsWith(".mov") ? await movToMp4(dest, localUrl) : localUrl;
	downloaded.set(original, finalUrl);
	return finalUrl;
}

/** QuickTime .mov doesn't play in Chrome/Firefox; transcode to H.264 MP4 when ffmpeg exists. */
async function movToMp4(movPath, movUrl) {
	const mp4Path = movPath.replace(/\.mov$/i, ".mp4");
	const mp4Url = movUrl.replace(/\.mov$/i, ".mp4");
	try {
		await fs.access(mp4Path);
	} catch {
		const r = spawnSync(
			"ffmpeg",
			["-y", "-loglevel", "error", "-i", movPath, "-vf", "scale='min(1600,iw)':-2", "-c:v", "libx264",
				"-crf", "26", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4Path],
			{ stdio: "inherit" }
		);
		if (r.status !== 0) {
			console.warn("  ! ffmpeg not available or failed; keeping .mov");
			return movUrl;
		}
		console.log(`  ⟳ ${mp4Url}`);
	}
	await fs.rm(movPath, { force: true });
	return mp4Url;
}

async function localizeMedia(html) {
	const urls = new Set();
	for (const [, u] of html.matchAll(/(?:src|href)="([^"]+)"/g)) urls.add(u);
	let out = html.replace(/\s(?:srcset|sizes)="[^"]*"/g, "");
	for (const u of urls) {
		if (!toOriginalUpload(u)) continue;
		const local = await download(u);
		out = out.split(`"${u}"`).join(`"${local}"`);
	}
	return out;
}

// ---------------------------------------------------------------------------
// HTML -> Markdown
// ---------------------------------------------------------------------------

// Turndown's Node DOM (domino) has limited selector support; stick to basics.
const byTag = (node, tag) => Array.from(node.getElementsByTagName(tag));
const first = (node, tag) => byTag(node, tag)[0];
const hasClass = (node, cls) => (" " + (node.getAttribute?.("class") || "") + " ").includes(` ${cls} `);
function closestTag(node, tag) {
	for (let n = node.parentNode; n; n = n.parentNode) if (n.nodeName === tag) return n;
	return null;
}

function createTurndown() {
	const td = new TurndownService({
		headingStyle: "atx",
		bulletListMarker: "-",
		codeBlockStyle: "fenced",
		emDelimiter: "*",
		hr: "---",
	});
	td.use(gfm);

	// WordPress button blocks -> plain HTML button link (styled by PostBody).
	td.addRule("wpButtons", {
		filter: (node) => node.nodeName === "DIV" && hasClass(node, "wp-block-buttons"),
		replacement: (_content, node) => {
			const links = byTag(node, "a")
				.map((a) => `<a class="btn btn-primary" href="${a.getAttribute("href")}">${a.textContent.trim()}</a>`)
				.join(" ");
			return `\n\n<div class="not-prose my-8">${links}</div>\n\n`;
		},
	});

	// Videos have no Markdown equivalent; keep them as HTML.
	td.addRule("video", {
		filter: (node) => node.nodeName === "FIGURE" && !!first(node, "video"),
		replacement: (_content, node) => {
			const v = first(node, "video");
			return `\n\n<video src="${v.getAttribute("src")}" controls autoplay loop muted playsinline></video>\n\n`;
		},
	});

	// Images: keep alt text; drop width/height noise. Linked images stay linked.
	td.addRule("figureImage", {
		filter: (node) => node.nodeName === "FIGURE" && !!first(node, "img"),
		replacement: (_content, node) => {
			const img = first(node, "img");
			const alt = (img.getAttribute("alt") || "").replace(/[\[\]]/g, "");
			const md = `![${alt}](${img.getAttribute("src")})`;
			let link = closestTag(img, "A");
			// WordPress links images to their own file; that's just noise.
			if (link && link.getAttribute("href") === img.getAttribute("src")) link = null;
			const caption = first(node, "figcaption")?.textContent.trim();
			return `\n\n${link ? `[${md}](${link.getAttribute("href")})` : md}${caption ? `\n*${caption}*` : ""}\n\n`;
		},
	});

	// WP "has-x-large-font-size" etc. are cosmetic; Turndown already ignores classes.
	return td;
}

function cleanMarkdown(md) {
	let out = md;
	for (const [from, to] of Object.entries(LINK_FIXES)) {
		out = out.split(`https://clicktailors.com${from}`).join(to);
	}
	// Make absolute links to the site itself relative.
	out = out.replace(/\]\(https?:\/\/(?:www\.)?clicktailors\.com(\/[^)]*)\)/g, "]($1)");
	out = out.replace(/href="https?:\/\/(?:www\.)?clicktailors\.com(\/[^"]*)"/g, 'href="$1"');
	return out.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

function decodeEntities(s) {
	return s
		.replace(/&#8217;|&#8216;/g, "’")
		.replace(/&#8220;|&#8221;/g, (m) => (m === "&#8220;" ? "“" : "”"))
		.replace(/&#8211;/g, "–")
		.replace(/&#8212;/g, "—")
		.replace(/&hellip;|&#8230;/g, "…")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'");
}

function excerptText(html) {
	return decodeEntities(html.replace(/<[^>]+>/g, ""))
		.replace(/\s*\[…\]\s*$/, "…")
		.replace(/\s+/g, " ")
		.trim();
}

const yamlString = (s) => JSON.stringify(s); // JSON strings are valid YAML

function frontmatter(obj) {
	const lines = ["---"];
	for (const [key, value] of Object.entries(obj)) {
		if (value === undefined || value === null) continue;
		if (Array.isArray(value)) {
			if (value.length === 0) lines.push(`${key}: []`);
			else {
				lines.push(`${key}:`);
				for (const v of value) lines.push(`  - ${yamlString(v)}`);
			}
		} else if (typeof value === "object") {
			lines.push(`${key}:`);
			for (const [k, v] of Object.entries(value)) {
				if (v !== undefined && v !== null) lines.push(`  ${k}: ${yamlString(v)}`);
			}
		} else {
			lines.push(`${key}: ${yamlString(value)}`);
		}
	}
	lines.push("---", "");
	return lines.join("\n");
}

// WordPress returns dates in site-local time without an offset; keep as-is.
const isoDate = (d) => (d ? d.replace(" ", "T") : undefined);

// ---------------------------------------------------------------------------

async function main() {
	console.log(`Fetching ${GRAPHQL_URL} …`);
	const res = await fetch(GRAPHQL_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: QUERY }),
	});
	const json = await res.json();
	if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
	const { posts, pages } = json.data;

	await fs.mkdir(POSTS_DIR, { recursive: true });
	await fs.mkdir(PAGES_DIR, { recursive: true });
	const td = createTurndown();

	for (const post of posts.nodes) {
		console.log(`post: ${post.slug}`);
		const html = await localizeMedia(post.content || "");
		const cover = post.featuredImage?.node?.sourceUrl
			? await download(post.featuredImage.node.sourceUrl)
			: undefined;
		const author = post.author?.node;
		const fm = frontmatter({
			title: decodeEntities(post.title),
			date: isoDate(post.date),
			modified: isoDate(post.modified),
			excerpt: excerptText(post.excerpt || ""),
			coverImage: cover,
			coverImageAlt: post.featuredImage?.node?.altText || undefined,
			author: author
				? {
						name: [author.firstName, author.lastName].filter(Boolean).join(" ") || author.name,
						avatar: author.avatar?.url,
				  }
				: undefined,
			categories: post.categories.nodes.map((c) => c.name).filter((c) => c !== "Uncategorized"),
			tags: post.tags.nodes.map((t) => t.name),
		});
		await fs.writeFile(path.join(POSTS_DIR, `${post.slug}.md`), fm + "\n" + cleanMarkdown(td.turndown(html)));
	}

	for (const page of pages.nodes) {
		if (!PAGES_TO_EXPORT.includes(page.slug)) continue;
		console.log(`page: ${page.slug}`);
		const html = await localizeMedia(page.content || "");
		const fm = frontmatter({ title: decodeEntities(page.title), modified: isoDate(page.modified) });
		await fs.writeFile(path.join(PAGES_DIR, `${page.slug}.md`), fm + "\n" + cleanMarkdown(td.turndown(html)));
	}

	console.log(`\nDone: ${posts.nodes.length} posts, ${PAGES_TO_EXPORT.length} pages, ${downloaded.size} media files.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
