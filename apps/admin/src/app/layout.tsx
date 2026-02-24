import "@repo/ui/styles/globals.css"
import { siteTitle } from "@repo/env/client"
import Providers from "@repo/ui/providers"
import { Skeleton } from "@repo/ui/skeleton"
import { type Metadata } from "next"
import localFont from "next/font/local"
import { Suspense, type ReactNode } from "react"

export const metadata: Metadata = {
  title: {
    default: `Admin - ${siteTitle}`,
    template: `%s | Admin - ${siteTitle}`,
  },
  description: `${siteTitle} Admin Console`,
  robots: {
    index: false,
    follow: false,
  },
}

export function generateViewport() {
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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
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
      </body>
    </html>
  )
}
