import { queryApi } from "@repo/api/orpc/query"
import { Skeleton } from "@repo/ui/skeleton"
import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import MarketplaceContent from "./marketplace-content"

export const metadata: Metadata = {
  title: "Browse Tools | Marketplace",
  description: "Explore and use AI-powered tools to automate your workflows",
}

export default async function MarketplacePage() {
  await connection()
  const categories = await queryApi.tools.getCategories.call({})
  const tags = await queryApi.tools.getTags.call({})

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Browse Tools
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Explore and use AI-powered tools to automate your workflows
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <MarketplaceContent categories={categories} tags={tags} />
      </Suspense>
    </div>
  )
}
