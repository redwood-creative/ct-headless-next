import Head from "next/head";
import { GetStaticProps } from "next";
import Layout from "./layout";
import { SITE_NAME } from "../lib/constants";
import * as Marketing from "../components/sections/marketing/_module";
import { MarketingSplitContent } from "../components/sections/marketing/MarketingSplit";
import { BlurbTwoByTwoGridContent } from "../components/sections/marketing/BlurbTwoByTwoGrid";
import BlogCarousel from "../components/blog/BlogCarousel";
import { getAllPosts, type PostMeta } from "../lib/blog";

interface HomeProps {
	recentPosts?: PostMeta[];
	heroContent?: Record<string, any>;
	gridContent?: BlurbTwoByTwoGridContent;
	splitContent?: MarketingSplitContent;
}

export default function Home({
	recentPosts = [],
	heroContent,
	gridContent,
	splitContent,
}: HomeProps) {
	return (
		<Layout>
			<Head>
				<title>{`${SITE_NAME}`}</title>
			</Head>
			<main>
				{heroContent && Object.keys(heroContent).length > 0 && (
					<Marketing.Hero content={heroContent} />
				)}
				{gridContent && gridContent.features?.length > 0 && (
					<Marketing.Splits.BlurbTwoByTwoGrid content={gridContent} />
				)}
				{splitContent && splitContent.features?.length > 0 && (
					<Marketing.Splits.MarketingSplit content={splitContent} />
				)}
				{recentPosts.length > 0 && <BlogCarousel posts={recentPosts} />}
				<Marketing.Newsletter />
			</main>
		</Layout>
	);
}

// pages/Home.tsx is also reachable as /Home because it lives in pages/.
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
	return { props: { recentPosts: getAllPosts().slice(0, 6) } };
};
