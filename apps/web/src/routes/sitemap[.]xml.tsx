import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { listCategories } from "db/services/categories"
import { listProducts } from "db/services/products"
import { siteUrl } from "env"

export const getSitemapXml = createServerFn({ method: "GET" }).handler(
  async () => {
    const baseUrl = siteUrl || "http://localhost:3000"

    const [categories, { products }] = await Promise.all([
      listCategories(),
      listProducts({ limit: 500, status: "active" }),
    ])

    const urls = [
      `${baseUrl}/`,
      `${baseUrl}/products`,
      ...categories.map((c) => `${baseUrl}/c/${c.slug}`),
      ...products.map((p) => `${baseUrl}/products/${p.slug}`),
    ]

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>${url === `${baseUrl}/` ? "1.0" : "0.8"}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`
  },
)

export const Route = createFileRoute("/sitemap.xml")({
  loader: () => getSitemapXml(),
  component: SitemapComponent,
})

function SitemapComponent() {
  const xml = Route.useLoaderData()
  return <pre className="font-mono text-xs whitespace-pre-wrap">{xml}</pre>
}
