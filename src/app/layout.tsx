import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PersonaForge",
  description: "Forge a concept, embed into photo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/@phosphor-icons/web" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} antialiased bg-[#09090b] text-zinc-100 font-sans h-screen flex overflow-hidden selection:bg-orange-500 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
