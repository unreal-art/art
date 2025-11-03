import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ServiceWorker from "./components/serviceWorker";
import ProgressBar from "./components/progressBar";
import { Suspense } from "react";
import appConfig from "@/config";

import { HighlightInit } from "@highlight-run/next/client";
import PageTransitionProvider from "./providers/PageTransitionProvider";

const nasalization = localFont({
  src: "./fonts/nasalization/Nasalization Rg.otf",
  preload: true,
  display: "swap",
  variable: "--font-nasalization",
});

const archivo = localFont({
  src: [
    {
      path: "./fonts/Archivo/Archivo-VariableFont_wdth,wght.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Archivo/Archivo-Italic-VariableFont_wdth,wght.ttf",
      weight: "400",
      style: "italic",
    },
    // {
    //   path: './Roboto-Bold.woff2',
    //   weight: '700',
    //   style: 'normal',
    // },
    // {
    //   path: './Roboto-BoldItalic.woff2',
    //   weight: '700',
    //   style: 'italic',
    // },
  ],
  preload: true,
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Unreal Art",
  description: "A place to let your unreal imagination come alive.",
  manifest: "/manifest.webmanifest", // Dynamically generated from `manifest.ts`
  // icons: [
  //   { rel: "icon", url: "/icons/android-chrome-192x192.png" },
  //   { rel: "icon", url: "/icons/android-chrome-512x512.png" },
  //   { rel: "apple-touch-icon", url: "/icons/apple-touch-icon.png" },
  // ],
  openGraph: {
    type: "website",
    url: "https://art.ideomind.org",
    title: "Unreal Art",
    description: "A place to let your unreal imagination come alive.",
    siteName: "Unreal",
    images: [
      {
        url: "https://art.ideomind.org/unreal_wordmark.png",
        width: 1200,
        height: 630,
        alt: "unreal art",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    // site: "@YourTwitterHandle",
    // creator: "@YourTwitterHandle",
    title: "Unreal Art",
    description: "A place to let your unreal imagination come alive.",
    images: ["https://art.ideomind.org/unreal_wordmark.png"],
  },
  other: {
    "theme-color": "#191919", // Discord embed color
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${nasalization.variable}`}>
      <head>
        {/* Storage URLs: Primary R2 storage for production assets */}
        <link rel="preconnect" href={appConfig.services.cloudflare.r2Url} />

        {/* Cloudflare URL: Used for both development and public resources */}
        <link rel="preconnect" href={appConfig.services.cloudflare.url} />

        {/* Gateway URLs: For external content */}
        <link rel="dns-prefetch" href="https://mesh3.network" />
        <link rel="dns-prefetch" href={appConfig.services.lighthouse.gateway} />

        {/* Preload critical assets for offline caching */}
        <link rel="preload" href="/offline.html" as="document" />
        <link rel="preload" href="/favicon.ico" as="image" />
        <link
          rel="preload"
          href="/icons/android-chrome-192x192.png"
          as="image"
        />
        <link rel="preload" href="/icons/apple-touch-icon.png" as="image" />

        {/* Preload key resources */}
        <link rel="preload" href="/Icon-White.png" as="image" />
        <link rel="preload" href="/logo.png" as="image" />

        {/* Add resource hints */}
        <link rel="prefetch" href="/auth" />
        <link rel="prefetch" href="/home" />
      </head>
      <body
        className={`bg-primary-13 text-primary-11 ${archivo.className} ${nasalization.className}`}
      >
        {/* Progress indicator with immediate feedback */}
        {/* <Suspense
          fallback={
            <div className="h-1 bg-white/30 absolute top-0 left-0 w-full animate-pulse"></div>
          }
        >
          <ProgressBar />
        </Suspense> */}

        {/* Main content with streaming SSR */}
        <Suspense fallback={<div className="min-h-screen bg-black"></div>}>
          <PageTransitionProvider>
            <Suspense fallback={<div className="min-h-screen bg-black"></div>}>
              {children}
            </Suspense>
          </PageTransitionProvider>
        </Suspense>
        <ServiceWorker />
      </body>
    </html>
  );
}
