import Avatar from "../ui/Images/Avatar";
import Date from "../sections/misc/Date";
import CoverImage from "./CoverImage";
import Link from "next/link";
import Section from "../ui/Section";
import Container from "../ui/Container";
import type { PostMeta } from "../../lib/blog";

export default function HeroPost({ post }: { post: PostMeta }) {
	const { title, coverImage, coverImageAlt, date, excerpt, author, slug } = post;

	return (
		<Section>
			<Container>
				<div className="mb-8 md:mb-16">
					{coverImage && (
						<CoverImage
							title={title}
							coverImage={coverImage}
							alt={coverImageAlt}
							slug={slug}
						/>
					)}
				</div>
				<div>
					<h3 className="mb-4 text-4xl font-bold lg:text-6xl leading-tight">
						<Link href={`/blog/posts/${slug}`} className="hover:underline">
							{title}
						</Link>
					</h3>
					<div className="mb-4 md:mb-0 text-sm text-gray-500">
						<Date dateString={date} />
					</div>
				</div>
				<div>
					<p className="text-lg leading-relaxed mb-4">{excerpt}</p>
					<Avatar author={author} />
				</div>
			</Container>
		</Section>
	);
}
