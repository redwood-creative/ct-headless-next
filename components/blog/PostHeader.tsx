import Avatar from "../ui/Images/Avatar";
import Date from "../sections/misc/Date";
import CoverImage from "./CoverImage";
import PostTitle from "./PostTitle";
import Categories from "./Categories";
import Section from "../ui/Section";
import Container from "../ui/Container";
import type { PostMeta } from "../../lib/blog";

export default function PostHeader({ post }: { post: PostMeta }) {
	const { title, coverImage, coverImageAlt, date, author, categories } = post;
	return (
		<Section>
			<Container>
				<div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-12 grid-cols-12">
					<div className="md:mb-12">
						<PostTitle>{title}</PostTitle>
						<Avatar author={author} />
						<div className="mb-6 text-sm">
							Posted <Date dateString={date} />
							<Categories categories={categories} />
						</div>
					</div>
					{coverImage && (
						<div className="mb-8 md:mb-16 sm:mx-0 align-middle mx-auto">
							<CoverImage title={title} coverImage={coverImage} alt={coverImageAlt} />
						</div>
					)}
				</div>
			</Container>
		</Section>
	);
}
