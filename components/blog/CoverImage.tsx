import cn from "classnames";
import Image from "next/image";
import Link from "next/link";

interface Props {
	title: string;
	coverImage: string;
	alt?: string;
	slug?: string;
}

export default function CoverImage({ title, coverImage, alt, slug }: Props) {
	const image = (
		<Image
			width={2000}
			height={1000}
			alt={alt || `Cover Image for ${title}`}
			src={coverImage}
			className={cn("rounded-xl m-auto w-full", {
				"duration-200": slug,
			})}
			priority
		/>
	);
	return (
		<div className="sm:mx-0">
			{slug ? (
				<Link href={`/blog/posts/${slug}`} aria-label={title}>
					{image}
				</Link>
			) : (
				image
			)}
		</div>
	);
}
