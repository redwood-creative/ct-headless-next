/**
 * File-based content: blog posts live in content/posts/*.md and standalone
 * pages (privacy policy, terms…) in content/pages/*.md. Everything is read at
 * build time, so publishing = committing a Markdown file and deploying.
 *
 * Server-only (uses `fs`): call from getStaticProps / getStaticPaths or app/
 * server components, never from client components.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const PAGES_DIR = path.join(process.cwd(), "content/pages");

export interface Author {
	name: string;
	avatar?: string;
}

/** Everything needed to list a post (no body). Safe to pass as page props. */
export interface PostMeta {
	slug: string;
	title: string;
	date: string;
	modified?: string;
	excerpt: string;
	coverImage?: string;
	coverImageAlt?: string;
	author?: Author;
	categories: string[];
	tags: string[];
}

export interface Post extends PostMeta {
	/** Rendered HTML */
	content: string;
}

export interface Page {
	slug: string;
	title: string;
	modified?: string;
	/** Rendered HTML */
	content: string;
}

const isProd = process.env.NODE_ENV === "production";

function slugsIn(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".md") && !f.startsWith("_"))
		.map((f) => f.replace(/\.md$/, ""));
}

function readFile(dir: string, slug: string) {
	const file = path.join(dir, `${slug}.md`);
	if (!fs.existsSync(file)) return null;
	return matter(fs.readFileSync(file, "utf8"));
}

/** gray-matter turns unquoted YAML dates into Date objects; props must be JSON. */
function toDateString(value: unknown): string | undefined {
	if (!value) return undefined;
	if (value instanceof Date) return value.toISOString();
	return String(value);
}

function renderMarkdown(md: string): string {
	return marked.parse(md, { async: false, gfm: true }) as string;
}

function excerptFrom(md: string, length = 200): string {
	const text = md
		.replace(/<[^>]+>/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[#>*_`~-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	return text.length > length ? text.slice(0, length).trimEnd() + "…" : text;
}

function parsePost(slug: string): (Post & { draft: boolean }) | null {
	const file = readFile(POSTS_DIR, slug);
	if (!file) return null;
	const { data, content } = file;

	const meta: PostMeta = {
		slug,
		title: String(data.title ?? slug),
		date: toDateString(data.date) ?? new Date(0).toISOString(),
		excerpt: data.excerpt ? String(data.excerpt) : excerptFrom(content),
		categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
		tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
	};
	// Optional fields are only set when present: Next.js props can't contain `undefined`.
	const modified = toDateString(data.modified);
	if (modified) meta.modified = modified;
	if (data.coverImage) meta.coverImage = String(data.coverImage);
	if (data.coverImageAlt) meta.coverImageAlt = String(data.coverImageAlt);
	if (data.author?.name) {
		meta.author = { name: String(data.author.name) };
		if (data.author.avatar) meta.author.avatar = String(data.author.avatar);
	}

	return { ...meta, content: renderMarkdown(content), draft: Boolean(data.draft) };
}

/** All published posts, newest first. Drafts (`draft: true`) only show in dev. */
export function getAllPosts(): PostMeta[] {
	return slugsIn(POSTS_DIR)
		.map(parsePost)
		.filter((p): p is Post & { draft: boolean } => !!p && !(isProd && p.draft))
		.map(({ content, draft, ...meta }) => meta)
		.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
	const post = parsePost(slug);
	if (!post || (isProd && post.draft)) return null;
	const { draft, ...rest } = post;
	return rest;
}

/** Up to `count` other posts, newest first, for "More Stories". */
export function getMorePosts(slug: string, count = 3): PostMeta[] {
	return getAllPosts()
		.filter((p) => p.slug !== slug)
		.slice(0, count);
}

export function getAllPageSlugs(): string[] {
	return slugsIn(PAGES_DIR);
}

export function getPageBySlug(slug: string): Page | null {
	const file = readFile(PAGES_DIR, slug);
	if (!file) return null;
	const page: Page = {
		slug,
		title: String(file.data.title ?? slug),
		content: renderMarkdown(file.content),
	};
	const modified = toDateString(file.data.modified);
	if (modified) page.modified = modified;
	return page;
}
