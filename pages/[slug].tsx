import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Layout from "./layout";
import { SITE_NAME } from "../lib/constants";
import Container from "../components/ui/Container";
import Section from "../components/ui/Section";
import { getAllPageSlugs, getPageBySlug, type Page as PageType } from "../lib/blog";

interface PageProps {
	page: PageType;
}

export default function Page({ page }: PageProps) {
	return (
		<Layout>
			<Head>
				<title>{`${page.title} | ${SITE_NAME}`}</title>
			</Head>
			<Section>
				<Container className="py-12">
					<h1 className="text-4xl font-bold mb-8">{page.title}</h1>
					<div
						className="prose max-w-none prose-table:block prose-table:overflow-x-auto"
						dangerouslySetInnerHTML={{ __html: page.content }}
					/>
				</Container>
			</Section>
		</Layout>
	);
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
	const page = getPageBySlug(params?.slug as string);
	if (!page) return { notFound: true };
	return { props: { page } };
};

export const getStaticPaths: GetStaticPaths = async () => {
	return {
		paths: getAllPageSlugs().map((slug) => `/${slug}`),
		fallback: false,
	};
};
