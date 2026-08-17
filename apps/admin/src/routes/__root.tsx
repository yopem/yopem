import type { QueryClient } from "@tanstack/react-query"

import { TanStackDevtools } from "@tanstack/react-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import { siteTitle } from "env"

import type { getSession } from "@/lib/auth"

import { GlobalError } from "@/components/global-error"
import { NotFound } from "@/components/not-found"
import { Providers } from "@/components/providers"
import appCss from "@/styles.css?url"

const SPECULATION_RULES =
  '{"prefetch":[{"source":"document","where":{"href_matches":"/*","relative_to":"document"},"eagerness":"moderate"}]}'

type Session = Exclude<Awaited<ReturnType<typeof getSession>>, false>

export interface RouterContext {
  queryClient: QueryClient
  session: Session | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `Admin - ${siteTitle}` },
      { name: "description", content: `${siteTitle} Admin Console` },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "theme-color",
        content: "#ffffff",
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: "#000000",
        media: "(prefers-color-scheme: dark)",
      },
      { name: "color-scheme", content: "light dark" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/images/favicon.svg" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        href: "/images/favicon-96x96.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/images/apple-touch-icon.png",
      },
      { rel: "manifest", href: "/site.webmanifest" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootComponent,
  errorComponent: GlobalError,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: "Tanstack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
