import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Input } from "ui/input"

import { ProductRunPanel } from "@/features/dashboard/product-run-panel"

const PAGE_SIZE = 20

export interface WorkspaceSearch {
  search?: string
  product?: string
}

export const Route = createFileRoute("/dashboard/products")({
  validateSearch: (search: Record<string, unknown>): WorkspaceSearch => {
    return {
      search: typeof search.search === "string" ? search.search : undefined,
      product: typeof search.product === "string" ? search.product : undefined,
    }
  },
  component: WorkspaceComponent,
})

function WorkspaceComponent() {
  const search = useSearch({ from: "/dashboard/products" })
  const navigate = useNavigate({ from: "/dashboard/products" })

  const [searchInput, setSearchInput] = useState(search.search ?? "")
  const [prevSearch, setPrevSearch] = useState(search.search)

  if (search.search !== prevSearch) {
    setPrevSearch(search.search)
    setSearchInput(search.search ?? "")
  }

  const listQuery = useQuery(
    queryApi.products.list.queryOptions({
      input: { limit: PAGE_SIZE, search: search.search },
    }),
  )

  const productQuery = useQuery(
    queryApi.products.bySlug.queryOptions({
      input: { slug: search.product ?? "" },
      enabled: Boolean(search.product),
    }),
  )

  const selectedProduct = productQuery.data

  useEffect(() => {
    if (search.product && productQuery.isError) {
      void navigate({
        search: (prev) => ({ ...prev, product: undefined }),
        replace: true,
      })
    }
  }, [search.product, productQuery.isError, navigate])

  const runPanelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (selectedProduct && runPanelRef.current) {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        runPanelRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }
  }, [selectedProduct])

  const updateSearch = (newParams: Partial<WorkspaceSearch>) => {
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, ...newParams }
        if (!next.search) delete next.search
        if (!next.product) delete next.product
        return next
      },
      replace: true,
    })
  }

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    updateSearch({ search: trimmed !== "" ? trimmed : undefined })
  }

  const products = listQuery.data?.products ?? []

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-2">
          Search products and run a tool.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-80 lg:shrink-0">
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
          </form>

          <div className="mt-4 space-y-2">
            {listQuery.isPending ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : products.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No products found
              </p>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => updateSearch({ product: product.slug })}
                  className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                    search.product === product.slug
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  {product.thumbnail?.url ? (
                    <img
                      src={product.thumbnail.url}
                      alt={product.name}
                      className="size-10 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                      <span className="text-foreground text-sm font-semibold">
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">
                      {product.name}
                    </p>
                    {product.excerpt && (
                      <p className="text-muted-foreground truncate text-xs">
                        {product.excerpt}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div ref={runPanelRef} className="min-w-0 flex-1">
          {selectedProduct ? (
            <ProductRunPanel product={selectedProduct} />
          ) : (
            <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-lg border p-12 text-center">
              <p className="text-foreground text-sm font-medium">
                Select a product to run
              </p>
              <p className="text-muted-foreground text-xs">
                Choose a product from the list to configure and run it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
