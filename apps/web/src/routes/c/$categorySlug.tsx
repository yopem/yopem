import {
  createFileRoute,
  Link,
  useNavigate,
  useLoaderData,
  notFound,
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

import { ProductCard } from "@/components/product-card"
import { SiteLayout } from "@/components/site-layout"

const PAGE_SIZE = 12

export interface CategorySearch {
  search?: string
  page?: number
}

export const Route = createFileRoute("/c/$categorySlug")({
  validateSearch: (search: Record<string, unknown>): CategorySearch => {
    return {
      search: typeof search.search === "string" ? search.search : undefined,
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

    const categories = await queryClient.ensureQueryData(
      queryApi.products.categories.queryOptions(),
    )
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
        },
      }),
    )

    return { category, listData, searchState: deps }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.category) return {}

    const { category, searchState } = loaderData
    const isFilteredOrPaginated = Boolean(
      (searchState.search ?? "") !== "" || (searchState.page ?? 1) > 1,
    )

    const categoryUrl = `${siteUrl ?? "http://localhost:3000"}/c/${category.slug}`
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
  const { category, listData, searchState } = useLoaderData({
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
        if (next.page === 1) delete next.page
        return next
      },
      replace: true,
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    updateSearch({ search: trimmed !== "" ? trimmed : undefined, page: 1 })
  }

  const clearSearch = () => {
    setSearchInput("")
    updateSearch({ search: undefined, page: 1 })
  }

  const page = searchState.page ?? 1
  const totalPages = Math.ceil(listData.total / PAGE_SIZE)

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
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

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex max-w-md gap-2">
          <Input
            type="search"
            placeholder={`Search ${category.name} tools...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full"
          />
          <Button type="submit" size="default" className="gap-1 font-medium">
            <SearchIcon className="size-4" />
            <span>Search</span>
          </Button>
          {searchState.search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSearch}
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </form>

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
                onClick={clearSearch}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="border-border flex items-center justify-between border-t pt-6">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages} ({listData.total} tools)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateSearch({ page: page - 1 })}
                className="gap-1 text-xs"
              >
                <ChevronLeftIcon className="size-3.5" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
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
