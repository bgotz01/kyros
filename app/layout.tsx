import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Elegant serif — titles and quotations only.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Kyros",
  description: "Identify the next paradigm.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-obsidian text-marble">
        <Navbar />
        {/* Below the navbar: sidebar + page content side by side */}
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
