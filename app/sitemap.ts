import { MetadataRoute } from "next";
import { SITE_URL } from "../lib/constants";
import { getAllPageSlugs, getAllPosts } from "../lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
	const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
		url: `${SITE_URL}/blog/posts/${post.slug}`,
		lastModified: new Date(post.modified || post.date),
		changeFrequency: "monthly",
		priority: 0.7,
	}));

	const contentPages: MetadataRoute.Sitemap = getAllPageSlugs().map((slug) => ({
		url: `${SITE_URL}/${slug}`,
		lastModified: new Date(),
		changeFrequency: "monthly",
		priority: 0.3,
	}));

	const routes: MetadataRoute.Sitemap = [
		{ url: SITE_URL, lastModified: new Date(), changeFrequency: "yearly", priority: 1 },
		{ url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
		{ url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
		{ url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
	];

	return [...routes, ...contentPages, ...blogPosts];
}
