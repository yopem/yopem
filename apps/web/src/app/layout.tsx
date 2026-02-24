import "@repo/ui/style.css"
import {
  logoOgHeight,
  logoOgUrl,
  logoOgWidth,
  siteDescription,
  siteDomain,
  siteTitle,
  siteUrl,
  xUsername,
} from "@repo/env/client"
import { Skeleton } from "@repo/ui/skeleton"
import { type Metadata } from "next"
import localFont from "next/font/local"
import { Suspense, type ReactNode } from "react"

import Scripts from "@/components/analytics-scripts"
import Providers from "@/components/providers"

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  keywords: [
    "AI tools",
    "marketplace",
    "automation",
    "artificial intelligence",
    "workflow",
  ],
  authors: [{ name: siteDomain }],
  creator: siteDomain,
  publisher: siteDomain,
  icons: [
    {
      rel: "icon",
      type: "image/svg+xml",
      url: "/favicon.svg",
    },
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: siteTitle,
    images: [
      {
        url: logoOgUrl,
        width: Number(logoOgWidth),
        height: Number(logoOgHeight),
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: xUsername ? `@${xUsername}` : undefined,
    images: [logoOgUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const generateViewport = () => {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
    colorScheme: "light dark",
  }
}

const adwaitaSans = localFont({
  src: [
    {
      path: "/fonts/AdwaitaSans-Regular.woff2",
      style: "normal",
    },
    {
      path: "/fonts/AdwaitaSans-Italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-adwaita-sans",
})

const adwaitaMono = localFont({
  src: [
    {
      path: "/fonts/AdwaitaMono-Regular.woff2",
      style: "normal",
    },
    {
      path: "/fonts/AdwaitaMono-Italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-adwaita-mono",
})

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html
      lang="en"
      className={`${adwaitaSans.variable} ${adwaitaMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <Suspense
            fallback={
              <div className="flex flex-col gap-4 p-8">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-96 w-full" />
              </div>
            }
          >
            {children}
          </Suspense>
        </Providers>
        <Scripts />
      </body>
    </html>
  )
}

export default RootLayout
