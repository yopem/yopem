"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { Loader2 as Loader2Icon, Package as PackageIcon } from "lucide-react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import SearchBar from "@/components/marketplace/search-bar"
import { Button } from "@/components/ui/button"
import { clientApi } from "@/lib/orpc/client"

import type { ToolCardProps } from "./tool-card"

const ToolCard = dynamic<ToolCardProps>(() => import("./tool-card"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border p-4">
      <div className="space-y-3">
        <div className="bg-muted h-5 w-2/3 rounded-sm" />
        <div className="bg-muted h-4 w-full rounded-sm" />
        <div className="bg-muted h-4 w-3/4 rounded-sm" />
      </div>
    </div>
  ),
})

interface MarketplaceGridProps {
  initialTools?: Awaited<ReturnType<typeof clientApi.tools.list>>["tools"]
  categoryIds?: string[]
  tagIds?: string[]
  priceFilter?: string
  status?: string
}

const MarketplaceGrid = ({
  initialTools = [],
  categoryIds = [],
  tagIds = [],
  priceFilter = "all",
  status = "active",
}: MarketplaceGridProps) => {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") ?? "")

  const queryKey = [
    "marketplace-tools",
    search,
    categoryIds.join(","),
    status,
    priceFilter,
    tagIds.join(","),
  ]

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }) => {
        const result = await clientApi.tools.list({
          search,
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
          status: status as "draft" | "active" | "archived" | "all",
          priceFilter: priceFilter as "all" | "free" | "paid",
          tagIds: tagIds.length > 0 ? tagIds : undefined,
          cursor: pageParam,
          limit: 20,
        })
        return result
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      ...(initialTools.length > 0 && {
        initialData: {
          pages: [{ tools: initialTools, nextCursor: undefined }],
          pageParams: [undefined],
        },
      }),
    })

  const tools = data?.pages.flatMap((page) => page.tools) ?? []

  const handleSearch = (query: string) => {
    setSearch(query)
  }

  const handleLoadMore = () => {
    void fetchNextPage()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} defaultValue={search} />
        </div>
        <div className="text-muted-foreground text-sm">
          {isLoading ? (
            <div className="h-4 w-20 animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700" />
          ) : (
            <span>
              {tools.length} {tools.length === 1 ? "tool" : "tools"}
            </span>
          )}
        </div>
      </div>

      <Shimmer loading={isLoading}>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="space-y-3">
                  <div className="h-5 w-2/3 rounded-sm bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-full rounded-sm bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-3/4 rounded-sm bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageIcon className="text-muted-foreground mb-4 size-10" />
            <h3 className="mb-1 text-lg font-medium">No tools found</h3>
            <p className="text-muted-foreground text-sm">
              {search
                ? "Try adjusting your search terms or clear the search."
                : "No tools are currently available."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  slug={tool.slug}
                  name={tool.name}
                  description={tool.description}
                  costPerRun={tool.costPerRun}
                  categories={tool.categories}
                  thumbnail={tool.thumbnail}
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Shimmer>
    </div>
  )
}

export default MarketplaceGrid
