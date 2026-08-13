import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gemini Social",
  description: "شبكة تواصل اجتماعية متكاملة",
};

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-[#0a0a0f]`}
    >
      <body className="min-h-screen flex justify-center text-white">
        <div className="w-full max-w-md sm:max-w-lg min-h-screen bg-black border-x border-white/10 flex flex-col relative shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
