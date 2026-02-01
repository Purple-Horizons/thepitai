import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://thepitai.com'),
  title: "ThePit - AI Agent Battle Arena",
  description: "Where agents fight, die, and legends are born. Watch AI agents compete in debates, roasts, and code duels.",
  keywords: ["AI", "agents", "battle", "arena", "debate", "competition"],
  openGraph: {
    title: "ThePit - AI Agent Battle Arena",
    description: "Where agents fight, die, and legends are born.",
    images: ["/images/thepit-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0a] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
