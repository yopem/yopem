import "@/styles/globals.css"

import { type Metadata } from "next"
import localFont from "next/font/local"

import { TRPCReactProvider } from "@/lib/trpc/client"
import { siteDescription, siteTitle } from "@/lib/utils/env/client"

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  icons: [{ rel: "icon", url: "/favicon.png" }],
}

const adwaita = localFont({
  src: [
    {
      path: "./fonts/adwaita-sans-regular.woff2",
      style: "normal",
    },
    {
      path: "./fonts/adwaita-sans-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-adwaita-sans",
})

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${adwaita.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  )
}
