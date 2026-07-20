import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { z } from "zod"

import { HydrateClient } from "rpc/hydration"
import { prefetchQueries } from "rpc/prefetch"
import { queryApi } from "rpc/query"
import { serverQueryApi } from "rpc/server-query"
import { Skeleton } from "ui/skeleton"

import MarketplaceContent from "@/components/marketplace/marketplace-content"

const marketplaceSearchSchema = z.object({
  search: z.string().optional(),
})

export const Route = createFileRoute("/_public/marketplace/")({
  validateSearch: marketplaceSearchSchema,
  loader: async ({ context }) => {
    const dehydratedState = await prefetchQueries(context.queryClient, [
      serverQueryApi.products.getCategories.queryOptions({ input: {} }),
      serverQueryApi.products.getTags.queryOptions({ input: {} }),
    ])
    return { dehydratedState }
  },
  component: MarketplacePage,
})

function MarketplacePage() {
  const { dehydratedState } = Route.useLoaderData()
  const { search } = Route.useSearch()
  const { data: categories } = useQuery({
    ...queryApi.products.getCategories.queryOptions({ input: {} }),
  })
  const { data: tags } = useQuery({
    ...queryApi.products.getTags.queryOptions({ input: {} }),
  })

  return (
    <HydrateClient state={dehydratedState}>
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-12 flex flex-col space-y-2">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Browse Products
          </h1>
          <p className="text-muted-foreground max-w-[600px] text-base/relaxed">
            Explore and use AI-powered products to automate your workflows. Find
            the right product for your specific needs.
          </p>
        </div>

        <Suspense
          fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}
        >
          <MarketplaceContent
            categories={categories ?? []}
            tags={tags ?? []}
            initialSearch={search}
          />
        </Suspense>
      </div>
    </HydrateClient>
  )
}
