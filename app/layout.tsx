import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import LayoutClient from "./LayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DRIFT — A Paper World",
  description: "A paper craft fantasy story about a crane named Milo who learns to fly.",
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
