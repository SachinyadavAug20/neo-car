import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DRIFT — A Paper World | Interactive 3D Storytelling",
  description: "An interactive 3D paper craft story about a crane named Milo who learns to fly. Explore 8 acts of cinematic storytelling with procedural audio, hidden secrets, and tactile interactions.",
  keywords: ["3D", "interactive", "storytelling", "paper craft", "WebGL", "Three.js", "React Three Fiber", "narrative", "hackathon"],
  authors: [{ name: "DRIFT Team" }],
  creator: "DRIFT",
  publisher: "DRIFT",
  metadataBase: new URL("https://drift-paper.vercel.app"),
  openGraph: {
    title: "DRIFT — A Paper World",
    description: "An interactive 3D paper craft storytelling experience. Help Milo the crane find the wind.",
    type: "website",
    siteName: "DRIFT",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DRIFT — A Paper World",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DRIFT — A Paper World",
    description: "An interactive 3D paper craft storytelling experience.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fdf6e3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#fdf6e3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#fdf6e3", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
