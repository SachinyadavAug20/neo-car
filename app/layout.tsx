import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DRIFT — A Paper World",
  description: "An interactive 3D paper craft story about a crane named Milo who learns to fly. Built for the 3D Websites Hackathon.",
  openGraph: {
    title: "DRIFT — A Paper World",
    description: "An interactive 3D paper craft storytelling experience.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
