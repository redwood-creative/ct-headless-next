import Avatar from "../ui/Images/Avatar";
import Date from "../sections/misc/Date";
import CoverImage from "./CoverImage";
import Link from "next/link";
import type { PostMeta } from "../../lib/blog";

export default function PostPreview({ post }: { post: PostMeta }) {
	const { title, coverImage, coverImageAlt, date, excerpt, author, slug } = post;
	return (
		<div>
			<div className="mb-5">
				{coverImage && (
					<CoverImage
						title={title}
						coverImage={coverImage}
						alt={coverImageAlt}
						slug={slug}
					/>
				)}
			</div>
			<h3 className="text-3xl mb-3 leading-snug">
				<Link href={`/blog/posts/${slug}`} className="hover:underline">
					{title}
				</Link>
			</h3>
			<div className="text-sm text-gray-500 mb-4">
				<Date dateString={date} />
			</div>
			<div className="text-lg leading-relaxed mb-4">
				{excerpt.length > 200 ? `${excerpt.substring(0, 200)}…` : excerpt}
				<Link href={`/blog/posts/${slug}`}> Read More</Link>
			</div>
			<Avatar author={author} />
		</div>
	);
}
