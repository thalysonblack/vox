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
  title: "Goodtaste®",
  description:
    "Goodtaste® — design portfolio. Crafted projects in branding, product, and web.",
  openGraph: {
    title: "Goodtaste®",
    description:
      "Goodtaste® — design portfolio. Crafted projects in branding, product, and web.",
    siteName: "Goodtaste®",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goodtaste®",
    description:
      "Goodtaste® — design portfolio. Crafted projects in branding, product, and web.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
