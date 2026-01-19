"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight as ArrowRightIcon,
  Search as SearchIcon,
} from "lucide-react"

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
  costPerRun: string | null
  categoryId: string | null
  createdAt: Date | null
}

interface MarketplaceGridProps {
  initialTools?: Tool[]
}

function ToolCard({ id, name, description, costPerRun }: Tool) {
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
}

function SearchBar({
  onSearch,
  defaultValue = "",
}: {
  onSearch: (query: string) => void
  defaultValue?: string
}) {
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
}

function MarketplaceGrid({ initialTools = [] }: MarketplaceGridProps) {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [cursor, setCursor] = useState<string | undefined>()
  const [tools, setTools] = useState<Tool[]>(initialTools)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (query: string) => {
    setSearch(query)
    setCursor(undefined)
    setLoading(true)
    try {
      const result = await clientApi.tools.list({ search: query, limit: 20 })
      setTools(result.tools)
      setCursor(result.nextCursor)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!cursor || loading) return
    setLoading(true)
    try {
      const result = await clientApi.tools.list({ search, cursor, limit: 20 })
      setTools((prev) => [...prev, ...result.tools])
      setCursor(result.nextCursor)
    } catch (error) {
      console.error("Load more failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SearchBar onSearch={handleSearch} defaultValue={search} />

      {loading && tools.length === 0 ? (
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

          {cursor && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MarketplaceGrid
