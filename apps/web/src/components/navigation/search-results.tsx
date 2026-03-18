import { Link } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"

interface SearchResult {
  id: string
  slug: string
  name: string
  excerpt: string | null
  costPerRun: string | null
  thumbnail: { id: string; url: string } | null
}

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  query: string
  onSeeAll: () => void
  onResultClick: () => void
  mobile?: boolean
}

const SearchResults = ({
  results,
  isLoading,
  query,
  onSeeAll,
  onResultClick,
  mobile = false,
}: SearchResultsProps) => {
  const containerClass = mobile
    ? "flex-1 overflow-y-auto"
    : "absolute top-full left-0 z-50 mt-1 w-80 rounded-md border bg-popover shadow-md"

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="space-y-1 p-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md px-3 py-2"
            >
              <div className="bg-muted size-8 shrink-0 animate-pulse rounded-sm" />
              <div className="flex-1 space-y-1">
                <div className="bg-muted h-3.5 w-32 animate-pulse rounded-sm" />
                <div className="bg-muted h-3 w-48 animate-pulse rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <SearchIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            No tools found for &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : (
        <div className="p-2">
          <div className="space-y-0.5">
            {results.map((result) => (
              <Link
                key={result.id}
                to="/marketplace/tools/$slug"
                params={{ slug: result.slug }}
                onClick={onResultClick}
                className="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
              >
                <div className="bg-muted size-8 shrink-0 overflow-hidden rounded-sm">
                  {result.thumbnail ? (
                    <img
                      src={result.thumbnail.url}
                      alt={result.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{result.name}</p>
                  {result.excerpt && (
                    <p className="text-muted-foreground truncate text-xs">
                      {result.excerpt}
                    </p>
                  )}
                </div>
                {result.costPerRun && Number(result.costPerRun) > 0 && (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {result.costPerRun}cr
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="mt-1 border-t pt-1">
            <button
              type="button"
              onClick={onSeeAll}
              className="hover:bg-accent text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <SearchIcon className="size-3.5" />
              See all results for &ldquo;{query}&rdquo;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchResults
