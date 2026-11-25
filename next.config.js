/** @type {import('next').NextConfig} */
module.exports = {
	images: {
		remotePatterns: [
			// Author avatars
			{ protocol: "https", hostname: "*.gravatar.com" },
			// Marketing imagery on the home page
			{ protocol: "https", hostname: "images.unsplash.com" },
		],
	},
};
