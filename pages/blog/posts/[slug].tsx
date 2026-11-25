import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Container from "../../../components/ui/Container";
import PostBody from "../../../components/blog/PostBody";
import MoreStories from "../../../components/blog/MoreStories";
import PostHeader from "../../../components/blog/PostHeader";
import SectionSeparator from "../../../components/ui/SectionSeparator";
import Layout from "../../layout";
import Tags from "../../../components/blog/Tags";
import { SITE_NAME, SITE_URL } from "../../../lib/constants";
import {
	getAllPosts,
	getMorePosts,
	getPostBySlug,
	type Post as PostType,
	type PostMeta,
} from "../../../lib/blog";

interface Props {
	post: PostType;
	morePosts: PostMeta[];
}

export default function Post({ post, morePosts }: Props) {
	const ogImage = post.coverImage
		? new URL(post.coverImage, SITE_URL).toString()
		: undefined;

	return (
		<Layout>
			<Container>
				<article>
					<Head>
						<title>{`${post.title} | ${SITE_NAME}`}</title>
						<meta name="description" content={post.excerpt} />
						<meta property="og:title" content={post.title} />
						<meta property="og:description" content={post.excerpt} />
						<meta property="og:type" content="article" />
						{ogImage && <meta property="og:image" content={ogImage} />}
					</Head>
					<PostHeader post={post} />
					<PostBody content={post.content} />
					<footer>{post.tags.length > 0 && <Tags tags={post.tags} />}</footer>
				</article>

				<SectionSeparator />
				{morePosts.length > 0 && <MoreStories posts={morePosts} />}
			</Container>
		</Layout>
	);
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
	const slug = params?.slug as string;
	const post = getPostBySlug(slug);
	if (!post) return { notFound: true };

	return {
		props: {
			post,
			morePosts: getMorePosts(slug, 3),
		},
	};
};

export const getStaticPaths: GetStaticPaths = async () => {
	return {
		paths: getAllPosts().map((p) => `/blog/posts/${p.slug}`),
		fallback: false,
	};
};
