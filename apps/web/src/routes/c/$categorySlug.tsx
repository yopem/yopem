import {
  createFileRoute,
  Link,
  useNavigate,
  useLoaderData,
  notFound,
} from "@tanstack/react-router"
import { SearchIcon, XIcon } from "lucide-react"
import { useState, type FormEvent } from "react"

import { siteTitle } from "env"
import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Input } from "ui/input"

import { SiteLayout } from "@/components/site-layout"
import { Pagination } from "@/features/storefront/pagination"
import { ProductCard } from "@/features/storefront/product-card"
import { getSiteUrl } from "@/lib/site-url"
import { toggleId } from "@/lib/utils/toggle-id"

const PAGE_SIZE = 12

export interface CategorySearch {
  search?: string
  tagIds?: string[]
  page?: number
}

export const Route = createFileRoute("/c/$categorySlug")({
  validateSearch: (search: Record<string, unknown>): CategorySearch => {
    return {
      search: typeof search.search === "string" ? search.search : undefined,
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
  loader: async ({ context: { queryClient }, params, deps }) => {
    const page = deps.page ?? 1
    const offset = (page - 1) * PAGE_SIZE

    const [categories, tags] = await Promise.all([
      queryClient.ensureQueryData(queryApi.products.categories.queryOptions()),
      queryClient.ensureQueryData(queryApi.products.tags.queryOptions()),
    ])

    const category = categories.find((c) => c.slug === params.categorySlug)
    if (!category) {
      throw notFound()
    }

    const listData = await queryClient.ensureQueryData(
      queryApi.products.list.queryOptions({
        input: {
          limit: PAGE_SIZE,
          offset,
          search: deps.search,
          categoryIds: [category.id],
          tagIds: deps.tagIds,
        },
      }),
    )

    return { category, categories, tags, listData, searchState: deps }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.category) return {}

    const { category, searchState } = loaderData
    const isFilteredOrPaginated = Boolean(
      (searchState.search ?? "") !== "" ||
      (searchState.tagIds?.length ?? 0) > 0 ||
      (searchState.page ?? 1) > 1,
    )

    const categoryUrl = `${getSiteUrl()}/c/${category.slug}`
    const meta = [
      { title: `${category.name} AI Tools - ${siteTitle ?? "Yopem"}` },
      {
        name: "description",
        content:
          category.description ??
          `Discover and run the best ${category.name} AI tools and automated workflows.`,
      },
      { property: "og:title", content: `${category.name} AI Tools` },
      {
        property: "og:description",
        content: category.description ?? `Explore ${category.name} AI tools.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: categoryUrl },
    ]

    if (isFilteredOrPaginated) {
      meta.push({ name: "robots", content: "noindex, follow" })
    }

    return {
      meta,
      links: [{ rel: "canonical", href: categoryUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: category.name,
            description:
              category.description ?? `Browse ${category.name} AI tools`,
            url: categoryUrl,
          }),
        },
      ],
    }
  },
  component: CategoryComponent,
})

function CategoryComponent() {
  const { category, categories, tags, listData, searchState } = useLoaderData({
    from: "/c/$categorySlug",
  })
  const navigate = useNavigate({ from: "/c/$categorySlug" })

  const [searchInput, setSearchInput] = useState(searchState.search ?? "")
  const [prevSearch, setPrevSearch] = useState(searchState.search)

  if (searchState.search !== prevSearch) {
    setPrevSearch(searchState.search)
    setSearchInput(searchState.search ?? "")
  }

  const updateSearch = (newParams: Partial<CategorySearch>) => {
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = {
          ...prev,
          ...newParams,
          page: newParams.page ?? 1,
        }
        if (!next.search) delete next.search
        if (!next.tagIds || (next.tagIds as string[]).length === 0)
          delete next.tagIds
        if (next.page === 1) delete next.page
        return next
      },
      replace: true,
    })
  }

  const handleTagToggle = (id: string) => {
    updateSearch({
      tagIds: toggleId(searchState.tagIds ?? [], id),
      page: 1,
    })
  }

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
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
    Boolean(searchState.search) || (searchState.tagIds?.length ?? 0) > 0

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/products"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Tools
            </Link>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <Badge variant="outline" className="text-xs">
              {category.name}
            </Badge>
          </div>

          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {category.name} AI Tools
          </h1>
          {category.description && (
            <p className="text-muted-foreground max-w-2xl text-sm">
              {category.description}
            </p>
          )}
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground/60 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder={`Search ${category.name} tools...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9"
              />
            </div>
            <Button type="submit" size="default" className="gap-1 font-medium">
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
                  const isCurrent = cat.id === category.id
                  return (
                    <Badge
                      key={cat.id}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      className="cursor-pointer text-xs transition-colors"
                      onClick={() => {
                        if (isCurrent) {
                          void navigate({ to: "/products", search: {} })
                        } else {
                          void navigate({
                            to: "/c/$categorySlug",
                            params: { categorySlug: cat.slug },
                          })
                        }
                      }}
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
              No tools found in {category.name}
            </p>
            {searchState.search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={listData.total}
          onPageChange={(nextPage) => updateSearch({ page: nextPage })}
        />
      </div>
    </SiteLayout>
  )
}
