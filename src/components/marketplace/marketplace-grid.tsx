"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { ArrowRightIcon, SearchIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import React, { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { clientApi } from "@/lib/orpc/client"

interface Tool {
  id: string
  name: string
  description: string | null
  status: "draft" | "active" | "archived"
  costPerRun: string | null
  categoryId: string | null
  createdAt: Date | null
}

interface MarketplaceGridProps {
  initialTools?: Tool[]
}

const ToolCard = React.memo(({ id, name, description, costPerRun }: Tool) => {
  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="line-clamp-1 text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {description ?? "No description available"}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {Number(costPerRun ?? 0) > 0 ? `${costPerRun} credits/run` : "Free"}
        </span>
        <Button variant="ghost" size="sm">
          <a href={`/marketplace/tools/${id}`} className="flex items-center">
            View <ArrowRightIcon className="ml-1 size-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
})
ToolCard.displayName = "ToolCard"

const SearchBar = React.memo(
  ({
    onSearch,
    defaultValue = "",
  }: {
    onSearch: (query: string) => void
    defaultValue?: string
  }) => {
    const [query, setQuery] = useState(defaultValue)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSearch(query)
    }

    return (
      <form onSubmit={handleSubmit} className="relative flex w-full max-w-md">
        <Input
          type="search"
          placeholder="Search tools..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-10"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-0"
        >
          <SearchIcon className="size-4" />
        </Button>
      </form>
    )
  },
)
SearchBar.displayName = "SearchBar"

function MarketplaceGrid({ initialTools = [] }: MarketplaceGridProps) {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") ?? "")

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["marketplace-tools", search],
      queryFn: async ({ pageParam }) => {
        const result = await clientApi.tools.list({
          search,
          cursor: pageParam,
          limit: 20,
        })
        return result
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: {
        pages: [{ tools: initialTools, nextCursor: undefined }],
        pageParams: [undefined],
      },
    })

  const tools = useMemo(() => data.pages.flatMap((page) => page.tools), [data])

  const handleSearch = (query: string) => {
    setSearch(query)
  }

  return (
    <div className="space-y-6">
      <SearchBar onSearch={handleSearch} defaultValue={search} />

      {tools.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          No tools found. Try a different search.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MarketplaceGrid
