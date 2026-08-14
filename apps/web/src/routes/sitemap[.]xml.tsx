import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { serverApi } from "rpc/server"

import { getSiteUrl } from "@/lib/site-url"

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
    const baseUrl = getSiteUrl()

    const [categories, productSlugs] = await Promise.all([
      serverApi.categories.list(),
      fetchAllProductSlugs(),
    ])

    const pages = [
      { path: "/", priority: "1.0" },
      { path: "/products", priority: "0.8" },
      ...categories.map((category) => ({
        path: `/category/${category.slug}`,
        priority: "0.8",
      })),
      ...productSlugs.map((slug) => ({
        path: `/products/${slug}`,
        priority: "0.8",
      })),
    ]

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    ({ path, priority }) => `  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
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
