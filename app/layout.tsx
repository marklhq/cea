import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
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
  title: "CEA Analytics - Singapore Property Transaction Data",
  description:
    "Analyze CEA salesperson property transaction records from Singapore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <div className="relative min-h-screen">
          {/* Background gradient effect */}
          <div className="fixed inset-0 -z-10 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(51,99,255,0.15),transparent)]" />
          </div>
          <Nav />
          <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
