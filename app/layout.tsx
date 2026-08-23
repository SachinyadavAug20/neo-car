import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import LayoutClient from "./LayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DRIFT — Floating Sky Islands",
  description: "An immersive 3D journey through floating sky islands. Explore crystal caverns, ancient ruins, and ethereal gardens suspended in the clouds.",
};

export default function RootLayout() {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body>
        <LayoutClient />
      </body>
    </html>
  );
}
