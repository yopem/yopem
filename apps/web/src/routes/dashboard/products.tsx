import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { PackageIcon, SearchIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Input } from "ui/input"

import { ProductRunPanel } from "@/features/dashboard/product-run-panel"
import { ProductSelectCard } from "@/features/dashboard/product-select-card"

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
      if (window.matchMedia("(max-width: 1279px)").matches) {
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

  useEffect(() => {
    const trimmed = searchInput.trim()
    const handler = setTimeout(() => {
      if (trimmed !== (search.search ?? "")) {
        updateSearch({ search: trimmed !== "" ? trimmed : undefined })
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [searchInput])

  const products = listQuery.data?.products ?? []

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-2">
          Search products and run a tool.
        </p>
      </div>

      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="relative">
            <SearchIcon className="text-muted-foreground/60 absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10"
            />
          </div>

          <div className="mt-6">
            {listQuery.isPending ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : products.length === 0 ? (
              <div className="bg-card flex flex-col items-center justify-center rounded-3xl border border-dashed py-24 text-center">
                <div className="bg-muted/50 mb-6 rounded-full p-6">
                  <PackageIcon className="text-muted-foreground size-12" />
                </div>
                <h3 className="mb-2 text-xl font-semibold tracking-tight">
                  No products found
                </h3>
                <p className="text-muted-foreground max-w-sm text-base">
                  Try adjusting your search terms.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductSelectCard
                    key={product.id}
                    product={product}
                    selected={search.product === product.slug}
                    onSelect={() => updateSearch({ product: product.slug })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div ref={runPanelRef} className="w-full xl:w-[400px] xl:shrink-0">
          {selectedProduct ? (
            <div className="space-y-4 xl:sticky xl:top-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
                    {selectedProduct.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-foreground truncate text-base font-semibold">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-muted-foreground text-xs">
                      Configure and run
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateSearch({ product: undefined })}
                  aria-label="Clear selection"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
              <ProductRunPanel product={selectedProduct} />
            </div>
          ) : (
            <div className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-xl border p-12 text-center xl:sticky xl:top-8">
              <p className="text-foreground text-sm font-medium">
                Select a product to run
              </p>
              <p className="text-muted-foreground text-xs">
                Choose a product from the grid to configure and run it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
