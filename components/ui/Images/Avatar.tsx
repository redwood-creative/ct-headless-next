import Image from "next/image";
import type { Author } from "../../../lib/blog";

export default function Avatar({ author }: { author?: Author }) {
	if (!author?.avatar) return null;

	return (
		<div className="flex items-center">
			<div className="w-10 h-10 relative mr-4">
				<Image
					src={author.avatar}
					width={48}
					height={48}
					className="rounded-full"
					alt={author.name || "Avatar"}
					priority
				/>
			</div>
			<div className="text-lg font-bold">{author.name}</div>
		</div>
	);
}
