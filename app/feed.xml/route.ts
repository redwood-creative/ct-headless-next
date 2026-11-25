import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../../lib/constants";
import { getAllPosts } from "../../lib/blog";

export const dynamic = "force-static";

const escape = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS feed at /feed.xml (linked from <Meta />). */
export function GET() {
	const items = getAllPosts()
		.map((post) => {
			const url = `${SITE_URL}/blog/posts/${post.slug}`;
			return `
		<item>
			<title>${escape(post.title)}</title>
			<link>${url}</link>
			<guid>${url}</guid>
			<pubDate>${new Date(post.date).toUTCString()}</pubDate>
			<description>${escape(post.excerpt)}</description>
		</item>`;
		})
		.join("");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>${escape(SITE_NAME)}</title>
		<link>${SITE_URL}/blog</link>
		<description>${escape(SITE_DESCRIPTION)}</description>${items}
	</channel>
</rss>`;

	return new Response(xml, {
		headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
	});
}
