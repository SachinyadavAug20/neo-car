import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DRIFT — A Paper World | Interactive 3D Storytelling",
    template: "%s | DRIFT — A Paper World",
  },
  description: "An interactive 3D paper craft story about a crane named Milo who learns to fly. Explore 8 acts of cinematic storytelling with procedural audio, hidden secrets, and tactile interactions.",
  keywords: ["3D", "interactive", "storytelling", "paper craft", "WebGL", "Three.js", "React Three Fiber", "narrative", "hackathon", "interactive story", "browser game", "creative coding"],
  authors: [{ name: "Sachin Yadav", url: "https://github.com/SachinyadavAug20" }],
  creator: "Sachin Yadav",
  publisher: "Sachin Yadav",
  metadataBase: new URL("https://drift-paper.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DRIFT — A Paper World",
    description: "An interactive 3D paper craft storytelling experience. Help Milo the crane find the wind.",
    url: "https://drift-paper.vercel.app",
    siteName: "DRIFT — A Paper World",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "DRIFT — A Paper World: Interactive 3D paper craft storytelling experience",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DRIFT — A Paper World",
    description: "An interactive 3D paper craft storytelling experience. Help Milo the crane find the wind.",
    images: ["/og-image.svg"],
    creator: "@sachinyadav",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  verification: {},
  category: "interactive storytelling",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fdf6e3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "DRIFT — A Paper World",
    description: "An interactive 3D paper craft story about a crane named Milo who learns to fly.",
    url: "https://drift-paper.vercel.app",
    applicationCategory: "Game",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Sachin Yadav",
      url: "https://github.com/SachinyadavAug20",
    },
    inLanguage: "en-US",
    isAccessibleForFree: true,
    screenshot: "/og-image.svg",
  };

  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#fdf6e3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#fdf6e3" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#fdf6e3", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
