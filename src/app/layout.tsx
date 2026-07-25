import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T212 Portfolio Dashboard",
  description:
    "High-fidelity portfolio dashboard for T212 with Czech tax tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#060914] text-slate-200">
        {/* Ambient glow orbs - reduced blur for performance */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-100 w-100 rounded-full bg-cyan-500/4 blur-[80px]" />
          <div className="absolute -bottom-40 right-0 h-100 w-100 rounded-full bg-indigo-500/4 blur-[80px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
