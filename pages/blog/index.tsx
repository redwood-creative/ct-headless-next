import Head from "next/head";
import { GetStaticProps } from "next";
import MoreStories from "../../components/blog/MoreStories";
import HeroPost from "../../components/blog/HeroPost";
import Intro from "../../components/sections/core/Intro";
import Layout from "../layout";
import { SITE_NAME } from "../../lib/constants";
import Newsletter from "../../components/sections/marketing/Newsletter";
import { getAllPosts, type PostMeta } from "../../lib/blog";

interface Props {
	posts: PostMeta[];
}

export default function Index({ posts }: Props) {
	const [heroPost, ...morePosts] = posts;
	const pageTitle = "Featured Posts";

	return (
		<Layout>
			<Head>
				<title>{`${pageTitle} | ${SITE_NAME}`}</title>
			</Head>
			<Intro pageTitle={pageTitle} />
			{heroPost && <HeroPost post={heroPost} />}
			{morePosts.length > 0 && <MoreStories posts={morePosts} />}
			<Newsletter />
		</Layout>
	);
}

export const getStaticProps: GetStaticProps<Props> = async () => {
	return { props: { posts: getAllPosts() } };
};
