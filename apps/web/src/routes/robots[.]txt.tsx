import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { getSiteUrl } from "@/lib/site-url"

export const getRobotsTxt = createServerFn({ method: "GET" }).handler(() => {
  const baseUrl = getSiteUrl()

  return `User-agent: *
Allow: /
Allow: /products
Allow: /category/
Disallow: /api/
Disallow: /login

Sitemap: ${baseUrl}/sitemap.xml
`
})

export const Route = createFileRoute("/robots.txt")({
  loader: () => getRobotsTxt(),
  component: RobotsComponent,
})

function RobotsComponent() {
  const txt = Route.useLoaderData()
  return <pre className="font-mono text-xs whitespace-pre-wrap">{txt}</pre>
}
