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
  description: "A place for product people."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${mono.variable} antialiased`}>
        <ContextProviders>{children}</ContextProviders>
      </body>
    </html>
  );
}
