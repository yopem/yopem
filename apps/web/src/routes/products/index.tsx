import {
  createFileRoute,
  useNavigate,
  useLoaderData,
} from "@tanstack/react-router"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { useState } from "react"

import { siteTitle, siteUrl } from "env"
import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Input } from "ui/input"

import { SiteLayout } from "@/components/site-layout"
import { ProductCard } from "@/features/storefront/product-card"

const PAGE_SIZE = 12

export interface CatalogSearch {
  search?: string
  categoryIds?: string[]
  tagIds?: string[]
  page?: number
}

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
    return {
      search: typeof search.search === "string" ? search.search : undefined,
      categoryIds: Array.isArray(search.categoryIds)
        ? search.categoryIds.filter(
            (id): id is string => typeof id === "string",
          )
        : typeof search.categoryIds === "string"
          ? [search.categoryIds]
          : undefined,
      tagIds: Array.isArray(search.tagIds)
        ? search.tagIds.filter((id): id is string => typeof id === "string")
        : typeof search.tagIds === "string"
          ? [search.tagIds]
          : undefined,
      page:
        typeof search.page === "number" && search.page > 0
          ? search.page
          : typeof search.page === "string"
            ? Math.max(1, parseInt(search.page, 10) || 1)
            : undefined,
    }
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps }) => {
    const page = deps.page ?? 1
    const offset = (page - 1) * PAGE_SIZE

    const [listData, categories, tags] = await Promise.all([
      queryClient.ensureQueryData(
        queryApi.products.list.queryOptions({
          input: {
            limit: PAGE_SIZE,
            offset,
            search: deps.search,
            categoryIds: deps.categoryIds,
            tagIds: deps.tagIds,
          },
        }),
      ),
      queryClient.ensureQueryData(queryApi.products.categories.queryOptions()),
      queryClient.ensureQueryData(queryApi.products.tags.queryOptions()),
    ])

    return { listData, categories, tags, searchState: deps }
  },
  head: ({ loaderData }) => {
    const isFilteredOrPaginated =
      Boolean(loaderData?.searchState.search) ||
      (loaderData?.searchState.categoryIds?.length ?? 0) > 0 ||
      (loaderData?.searchState.tagIds?.length ?? 0) > 0 ||
      (loaderData?.searchState.page ?? 1) > 1

    const meta = [
      { title: `All AI Tools & Workflows - ${siteTitle ?? "Yopem"}` },
      {
        name: "description",
        content:
          "Browse our catalog of AI-powered workflow tools. Filter by category or search for specific AI utilities.",
      },
      {
        property: "og:title",
        content: `All AI Tools - ${siteTitle ?? "Yopem"}`,
      },
      {
        property: "og:description",
        content: "Explore all available AI tools.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: `${siteUrl ?? "http://localhost:3000"}/products`,
      },
    ]

    if (isFilteredOrPaginated) {
      meta.push({ name: "robots", content: "noindex, follow" })
    }

    return {
      meta,
      links: [
        {
          rel: "canonical",
          href: `${siteUrl ?? "http://localhost:3000"}/products`,
        },
      ],
    }
  },
  component: CatalogComponent,
})

function CatalogComponent() {
  const { listData, categories, tags, searchState } = useLoaderData({
    from: "/products/",
  })
  const navigate = useNavigate({ from: "/products/" })

  const [searchInput, setSearchInput] = useState(searchState.search ?? "")
  const [prevSearch, setPrevSearch] = useState(searchState.search)

  if (searchState.search !== prevSearch) {
    setPrevSearch(searchState.search)
    setSearchInput(searchState.search ?? "")
  }

  const updateSearch = (newParams: Partial<CatalogSearch>) => {
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = {
          ...prev,
          ...newParams,
          page: newParams.page ?? 1,
        }
        if (!next.search) delete next.search
        if (!next.categoryIds || (next.categoryIds as string[]).length === 0)
          delete next.categoryIds
        if (!next.tagIds || (next.tagIds as string[]).length === 0)
          delete next.tagIds
        if (next.page === 1) delete next.page
        return next
      },
      replace: true,
    })
  }

  const handleCategoryToggle = (id: string) => {
    const current = searchState.categoryIds ?? []
    const updated = current.includes(id)
      ? current.filter((c: string) => c !== id)
      : [...current, id]
    updateSearch({ categoryIds: updated, page: 1 })
  }

  const handleTagToggle = (id: string) => {
    const current = searchState.tagIds ?? []
    const updated = current.includes(id)
      ? current.filter((t: string) => t !== id)
      : [...current, id]
    updateSearch({ tagIds: updated, page: 1 })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    updateSearch({ search: trimmed !== "" ? trimmed : undefined, page: 1 })
  }

  const clearFilters = () => {
    setSearchInput("")
    void navigate({ search: {}, replace: true })
  }

  const page = searchState.page ?? 1
  const totalPages = Math.ceil(listData.total / PAGE_SIZE)
  const hasActiveFilters =
    Boolean(searchState.search) ||
    (searchState.categoryIds?.length ?? 0) > 0 ||
    (searchState.tagIds?.length ?? 0) > 0

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Explore AI Tools
          </h1>
          <p className="text-muted-foreground text-sm">
            Browse our library of AI tools and automated workflows.
          </p>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground/60 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search tools by name or keywords..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9"
              />
            </div>
            <Button
              type="submit"
              size="default"
              className="gap-1.5 font-medium"
            >
              <SearchIcon className="size-4" />
              <span>Search</span>
            </Button>
          </form>

          {/* Categories Filter Badges */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Categories
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isSelected = (searchState.categoryIds ?? []).includes(
                    cat.id,
                  )
                  return (
                    <Badge
                      key={cat.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="cursor-pointer text-xs transition-colors"
                      onClick={() => handleCategoryToggle(cat.id)}
                    >
                      {cat.name}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tags Filter Badges */}
          {tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const isSelected = (searchState.tagIds ?? []).includes(tag.id)
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="cursor-pointer text-xs transition-colors"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      #{tag.name}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Active Filter Clear Bar */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-muted-foreground text-xs">
                Active filters
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-xs"
                onClick={clearFilters}
              >
                <XIcon className="size-3" />
                <span>Clear All</span>
              </Button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {listData.products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listData.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border-border text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm font-medium">
              No tools found matching your criteria
            </p>
            <p className="mt-1 text-xs">
              Try searching for a different keyword or clear active filters.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="border-border flex items-center justify-between border-t pt-6">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages} ({listData.total} total tools)
            </span>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateSearch({ page: page - 1 })}
                className="gap-1 text-xs"
              >
                <ChevronLeftIcon className="size-3.5" />
                <span>Previous</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateSearch({ page: page + 1 })}
                className="gap-1 text-xs"
              >
                <span>Next</span>
                <ChevronRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  )
}
