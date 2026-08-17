import { createFileRoute, notFound } from "@tanstack/react-router"

import { siteTitle } from "env"
import { queryApi } from "rpc/query"

import { ProductDetail } from "@/features/storefront/product-detail"
import { getSiteUrl } from "@/lib/site-url"

export const Route = createFileRoute("/products/$productSlug")({
  loader: async ({ context: { queryClient }, params }) => {
    const product = await queryClient
      .ensureQueryData(
        queryApi.products.bySlug.queryOptions({
          input: { slug: params.productSlug },
        }),
      )
      .catch(() => null)

    if (!product) {
      throw notFound()
    }

    return { product }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) return {}

    const { product } = loaderData
    const productUrl = `${getSiteUrl()}/products/${product.slug}`
    const description =
      product.excerpt ??
      product.description ??
      `Run ${product.name} AI tool on Yopem.`

    return {
      meta: [
        { title: `${product.name} - ${siteTitle ?? "Yopem"}` },
        { name: "description", content: description },
        { property: "og:title", content: product.name },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: productUrl },
      ],
      links: [{ rel: "canonical", href: productUrl }],
    }
  },
  component: ProductDetail,
})
