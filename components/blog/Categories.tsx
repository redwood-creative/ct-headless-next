export default function Categories({ categories }: { categories: string[] }) {
	if (categories.length === 0) return null;
	return (
		<span className="ml-1">
			under
			{categories.map((name) => (
				<span key={name} className="ml-1">
					{name}
				</span>
			))}
		</span>
	);
}
