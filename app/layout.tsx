import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "../styles/index.css";
import "@primer/react-brand/lib/css/main.css";
import DrawerNavbar from "../components/navbar/DaisyNavbar";
import Footer from "../components/sections/core/Footer";
import { SITE_NAME, SITE_DESCRIPTION } from "../lib/constants";
import ClientProviders from "../components/providers/ClientProviders";
import { Suspense } from "react";
import Integrations from "../components/integrations/integrations";
import ThirdPartyMetaTags from "../components/integrations/ThirdPartyMetaTags";
import FacebookNoscript from "../components/integrations/facebook/noscript";

const bricolage = Bricolage_Grotesque({
	weight: "variable",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: SITE_NAME,
	description: SITE_DESCRIPTION,
	icons: {
		icon: [
			{ url: "/favicon/icon.svg", type: "image/svg+xml" },
			{ url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
		],
		shortcut: "/favicon/favicon.ico",
		apple: "/favicon/apple-touch-icon.png",
	},
	manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<ThirdPartyMetaTags />
				<FacebookNoscript />
			</head>
			<body className={bricolage.className}>
				<Suspense fallback={null}>
					<ClientProviders>
						<Integrations />
						<div className="min-h-screen flex flex-col justify-between">
							<DrawerNavbar
								pageContent={<main>{children}</main>}
							/>
						</div>
						<Footer />
					</ClientProviders>
				</Suspense>
			</body>
		</html>
	);
}
