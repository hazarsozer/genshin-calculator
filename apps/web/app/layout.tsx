import type { Metadata } from "next";
import { Geist, Geist_Mono, Teko } from "next/font/google";
import "./globals.css";
import { ThemeRoot } from "@/components/shell/ThemeRoot";
import { TopBar } from "@/components/shell/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Condensed display face for the big damage numbers (game-HUD feel).
const teko = Teko({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Genshin Damage Calculator",
  description:
    "Oracle-verified Genshin Impact damage calculator built on a byte-exact port of Aspirine's engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${teko.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeRoot>
          <TopBar />
          {children}
        </ThemeRoot>
      </body>
    </html>
  );
}
