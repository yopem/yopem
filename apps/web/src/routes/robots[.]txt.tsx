import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { siteUrl } from "env"

export const getRobotsTxt = createServerFn({ method: "GET" }).handler(() => {
  const baseUrl = siteUrl || "http://localhost:3000"

  return `User-agent: *
Allow: /
Allow: /products
Allow: /c/
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
