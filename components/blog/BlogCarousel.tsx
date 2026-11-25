import PostPreview from "./PostPreview";
import Container from "../ui/Container";
import Section from "../ui/Section";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { PostMeta } from "../../lib/blog";

export default function BlogCarousel({ posts }: { posts: PostMeta[] }) {
	return (
		<Section>
			<Container>
				<div className="relative">
					<h2 className="mb-8 text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
						Latest Posts
					</h2>

					<div className="carousel carousel-center w-full gap-4 md:gap-8 py-4 overflow-x-auto">
						{posts.map((post) => (
							<div
								key={post.slug}
								className="carousel-item w-[280px] md:w-[350px]"
							>
								<PostPreview post={post} />
							</div>
						))}
					</div>

					<div className="absolute right-0 top-0 space-x-1">
						<button
							onClick={() => {
								const carousel =
									document.querySelector(".carousel");
								carousel?.scrollBy({
									left: -300,
									behavior: "smooth",
								});
							}}
							className="btn btn-circle btn-ghost"
							aria-label="Scroll left"
						>
							<ChevronLeftIcon className="w-6 h-6" />
						</button>
						<button
							onClick={() => {
								const carousel =
									document.querySelector(".carousel");
								carousel?.scrollBy({
									left: 300,
									behavior: "smooth",
								});
							}}
							className="btn btn-circle btn-ghost"
							aria-label="Scroll right"
						>
							<ChevronRightIcon className="w-6 h-6" />
						</button>
					</div>
				</div>
			</Container>
		</Section>
	);
}
