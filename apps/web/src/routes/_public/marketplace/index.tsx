import { createFileRoute } from "@tanstack/react-router"
import { queryApi } from "@repo/orpc/query"
import { Skeleton } from "@repo/ui/skeleton"
import { Suspense } from "react"

import MarketplaceContent from "@/components/marketplace/marketplace-content"

export const Route = createFileRoute("/_public/marketplace/")({
  loader: async () => {
    const [categories, tags] = await Promise.all([
      queryApi.tools.getCategories.call({}),
      queryApi.tools.getTags.call({}),
    ])
    return { categories, tags }
  },
  component: MarketplacePage,
})

function MarketplacePage() {
  const { categories, tags } = Route.useLoaderData()

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="mb-12 flex flex-col space-y-2">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
          Browse Tools
        </h1>
        <p className="text-muted-foreground max-w-[600px] text-base/relaxed">
          Explore and use AI-powered tools to automate your workflows. Find the
          right tool for your specific needs.
        </p>
      </div>

      <Suspense
        fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}
      >
        <MarketplaceContent categories={categories} tags={tags} />
      </Suspense>
    </div>
  )
}
