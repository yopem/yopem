import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { siteUrl } from "env"
import { serverApi } from "rpc/server"

const PRODUCT_PAGE_SIZE = 100

const fetchAllProductSlugs = async (): Promise<string[]> => {
  const slugs: string[] = []
  for (let offset = 0; ; offset += PRODUCT_PAGE_SIZE) {
    const page = await serverApi.products.list({
      limit: PRODUCT_PAGE_SIZE,
      offset,
    })
    slugs.push(...page.products.map((product) => product.slug))
    if (!page.hasMore) break
  }
  return slugs
}

export const getSitemapXml = createServerFn({ method: "GET" }).handler(
  async () => {
    const baseUrl = siteUrl || "http://localhost:3000"

    const [categories, productSlugs] = await Promise.all([
      serverApi.categories.list(),
      fetchAllProductSlugs(),
    ])

    const urls = [
      `${baseUrl}/`,
      `${baseUrl}/products`,
      ...categories.map((category) => `${baseUrl}/c/${category.slug}`),
      ...productSlugs.map((slug) => `${baseUrl}/products/${slug}`),
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
