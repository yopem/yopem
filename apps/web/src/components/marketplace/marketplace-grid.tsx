"use client"

import { clientApi } from "@repo/orpc/client"
import { Button } from "@repo/ui/button"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Loader2 as Loader2Icon, Package as PackageIcon } from "lucide-react"
import dynamic from "next/dynamic"
import { Shimmer } from "shimmer-from-structure"

import SearchBar from "@/components/marketplace/search-bar"

import type { ToolCardProps } from "./tool-card"

const ToolCard = dynamic<ToolCardProps>(() => import("./tool-card"), {
  ssr: false,
  loading: () => (
    <div className="bg-card rounded-2xl border p-6 shadow-sm">
      <div className="space-y-4">
        <div className="bg-muted aspect-video w-full animate-pulse rounded-xl" />
        <div className="space-y-2">
          <div className="bg-muted h-5 w-2/3 animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-full animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded-md" />
        </div>
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
  initialSearch?: string
}

type ToolListItem = Awaited<
  ReturnType<typeof clientApi.tools.list>
>["tools"][number]

const EMPTY_TOOLS: ToolListItem[] = []
const EMPTY_CATEGORY_IDS: string[] = []
const EMPTY_TAG_IDS: string[] = []

const MarketplaceGrid = ({
  initialTools = EMPTY_TOOLS,
  categoryIds = EMPTY_CATEGORY_IDS,
  tagIds = EMPTY_TAG_IDS,
  priceFilter = "all",
  status = "active",
  initialSearch = "",
}: MarketplaceGridProps) => {
  const search = initialSearch
  const setSearch = (_value: string) => {
    // Search updates are handled via URL in this component
  }

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
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <SearchBar onSearch={handleSearch} defaultValue={search} />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          {isLoading ? (
            <div className="bg-muted h-5 w-24 animate-pulse rounded-full" />
          ) : (
            <div className="bg-muted/50 rounded-full px-3 py-1">
              {tools.length} {tools.length === 1 ? "tool" : "tools"} available
            </div>
          )}
        </div>
      </div>

      <Shimmer loading={isLoading}>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="bg-muted aspect-video w-full animate-pulse rounded-xl" />
                  <div className="space-y-2">
                    <div className="bg-muted h-5 w-2/3 animate-pulse rounded-md" />
                    <div className="bg-muted h-4 w-full animate-pulse rounded-md" />
                    <div className="bg-muted h-4 w-3/4 animate-pulse rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="bg-card flex flex-col items-center justify-center rounded-3xl border border-dashed py-24 text-center">
            <div className="bg-muted/50 mb-6 rounded-full p-6">
              <PackageIcon className="text-muted-foreground size-12" />
            </div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight">
              No tools found
            </h3>
            <p className="text-muted-foreground max-w-sm text-base">
              {search
                ? "Try adjusting your search terms or filter criteria."
                : "No tools are currently available in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  slug={tool.slug}
                  name={tool.name}
                  description={tool.description}
                  excerpt={tool.excerpt}
                  costPerRun={tool.costPerRun}
                  categories={tool.categories}
                  thumbnail={tool.thumbnail}
                  averageRating={tool.averageRating}
                  reviewCount={tool.reviewCount}
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="flex justify-center pt-4 pb-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full px-8 font-medium"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2Icon className="mr-2 size-5 animate-spin" />
                      Loading more tools...
                    </>
                  ) : (
                    "Load more tools"
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Shimmer>
    </div>
  )
}

export default MarketplaceGrid
