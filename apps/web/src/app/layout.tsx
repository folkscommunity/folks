import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

import { ContextProviders } from "@/components/context-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Folks",
  description:
    "Folks is a place for product people (designers, engineers, founders, painters, carpenters, and anyone else who crafts something) to share their creations and thoughts with each other and feel comfortable doing so.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://folkscommunity.com",
    images: [
      {
        url: "https://folkscommunity.com/images/og.jpg",
        width: 1200,
        height: 675,
        alt: "Folks"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Folks",
    description: "A place for product people.",
    images: [
      {
        url: "https://folkscommunity.com/images/og.jpg",
        width: 1200,
        height: 675,
        alt: "Folks"
      }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        />
        <meta name="theme-color" content="#00050c" />

        <script
          defer
          data-domain="folkscommunity.com"
          data-api="https://p.lum.is/api/event"
          src="/js/s.js"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${mono.variable} antialiased`}>
        <ContextProviders>{children}</ContextProviders>
      </body>
    </html>
  );
}
