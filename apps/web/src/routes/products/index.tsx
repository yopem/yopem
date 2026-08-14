import {
  createFileRoute,
  useNavigate,
  useLoaderData,
} from "@tanstack/react-router"
import { SearchIcon, XIcon } from "lucide-react"
import { useState, type FormEvent } from "react"

import { siteTitle } from "env"
import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Input } from "ui/input"

import { SiteLayout } from "@/components/site-layout"
import { MarketplaceGrid } from "@/features/storefront/marketplace-grid"
import { MarketplaceSidebar } from "@/features/storefront/marketplace-sidebar"
import { Pagination } from "@/features/storefront/pagination"
import { getSiteUrl } from "@/lib/site-url"

const PAGE_SIZE = 12

export interface CatalogSearch {
  search?: string
  categorySlugs?: string[]
  tagSlugs?: string[]
  page?: number
}

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
    return {
      search: typeof search.search === "string" ? search.search : undefined,
      categorySlugs: Array.isArray(search.categorySlugs)
        ? search.categorySlugs.filter(
            (slug): slug is string => typeof slug === "string",
          )
        : typeof search.categorySlugs === "string"
          ? [search.categorySlugs]
          : undefined,
      tagSlugs: Array.isArray(search.tagSlugs)
        ? search.tagSlugs.filter(
            (slug): slug is string => typeof slug === "string",
          )
        : typeof search.tagSlugs === "string"
          ? [search.tagSlugs]
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

    const [categories, tags] = await Promise.all([
      queryClient.ensureQueryData(queryApi.products.categories.queryOptions()),
      queryClient.ensureQueryData(queryApi.products.tags.queryOptions()),
    ])

    const categoryIds = deps.categorySlugs?.length
      ? categories
          .filter((c) => deps.categorySlugs?.includes(c.slug))
          .map((c) => c.id)
      : undefined
    const tagIds = deps.tagSlugs?.length
      ? tags.filter((t) => deps.tagSlugs?.includes(t.slug)).map((t) => t.id)
      : undefined

    const listData = await queryClient.ensureQueryData(
      queryApi.products.list.queryOptions({
        input: {
          limit: PAGE_SIZE,
          offset,
          search: deps.search,
          categoryIds,
          tagIds,
        },
      }),
    )

    return { listData, categories, tags, searchState: deps }
  },
  head: ({ loaderData }) => {
    const isFilteredOrPaginated =
      Boolean(loaderData?.searchState.search) ||
      (loaderData?.searchState.categorySlugs?.length ?? 0) > 0 ||
      (loaderData?.searchState.tagSlugs?.length ?? 0) > 0 ||
      (loaderData?.searchState.page ?? 1) > 1

    const meta = [
      { title: `Browse Products - ${siteTitle ?? "Yopem"}` },
      {
        name: "description",
        content:
          "Explore and use AI-powered products to automate your workflows. Find the right product for your specific needs.",
      },
      {
        property: "og:title",
        content: `Browse Products - ${siteTitle ?? "Yopem"}`,
      },
      {
        property: "og:description",
        content: "Explore all available AI products.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: `${getSiteUrl()}/products`,
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
          href: `${getSiteUrl()}/products`,
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
        if (!next.categorySlugs || (next.categorySlugs as string[]).length === 0)
          delete next.categorySlugs
        if (!next.tagSlugs || (next.tagSlugs as string[]).length === 0)
          delete next.tagSlugs
        if (next.page === 1) delete next.page
        return next
      },
      replace: true,
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
    Boolean(searchState.search) ||
    (searchState.categorySlugs?.length ?? 0) > 0 ||
    (searchState.tagSlugs?.length ?? 0) > 0

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-12 flex flex-col space-y-2">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Browse Products
          </h1>
          <p className="text-muted-foreground max-w-[600px] text-base/relaxed">
            Explore and use AI-powered products to automate your workflows. Find
            the right product for your specific needs.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <MarketplaceSidebar categories={categories} tags={tags} />

          <div className="min-w-0 flex-1 space-y-6">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="text-muted-foreground/60 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  type="search"
                  placeholder="Search products..."
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
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="default"
                  className="gap-1.5"
                  onClick={clearFilters}
                >
                  <XIcon className="size-4" />
                  <span>Clear</span>
                </Button>
              )}
            </form>

            <MarketplaceGrid products={listData.products} />

            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={listData.total}
              onPageChange={(nextPage) => updateSearch({ page: nextPage })}
            />
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
