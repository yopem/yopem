import { useQuery } from "@tanstack/react-query"
import {
  useLoaderData,
  useNavigate,
  useRouteContext,
  Link,
} from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  CalendarIcon,
  FolderIcon,
  PlayIcon,
  TagIcon,
  ZapIcon,
} from "lucide-react"

import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Separator } from "ui/separator"
import { formatDateOnly } from "utils/format-date"

import { SiteLayout } from "@/components/site-layout"
import { RichTextView } from "@/features/storefront/rich-text-view"
import { loginAndRedirect } from "@/lib/login"

export function ProductDetail() {
  const { product: initialProduct } = useLoaderData({
    from: "/products/$productSlug",
  })
  const { session } = useRouteContext({ from: "__root__" })
  const navigate = useNavigate({ from: "/products/$productSlug" })

  const productQuery = useQuery(
    queryApi.products.bySlug.queryOptions({
      input: { slug: initialProduct.slug },
    }),
  )
  const product = productQuery.data ?? initialProduct

  const handleUseApp = () => {
    if (session) {
      void navigate({
        to: "/dashboard/products",
        search: { product: product.slug },
      })
    } else {
      void loginAndRedirect(`/dashboard/products?product=${product.slug}`)
    }
  }

  const cost = Number(product.creditsPerRun ?? 0)
  const formattedDate = formatDateOnly(product.updatedAt) || "N/A"

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            to="/products"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors"
          >
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Marketplace
          </Link>
        </div>

        {/* Main Content Layout matching yopem-old */}
        <div className="flex flex-col gap-y-10 lg:flex-row lg:gap-x-12">
          {/* Left Column */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-y-4 sm:flex-row sm:items-start sm:gap-x-6">
              {product.thumbnail?.url ? (
                <div className="bg-muted border-border flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border sm:size-20">
                  <img
                    src={product.thumbnail.url}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-muted border-border flex size-16 shrink-0 items-center justify-center rounded-2xl border sm:size-20">
                  <span className="text-foreground text-3xl font-semibold">
                    {product.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                    {product.name}
                  </h1>
                  <Badge variant="secondary" className="rounded-md font-medium">
                    {product.status}
                  </Badge>
                </div>

                <RichTextView
                  content={product.descriptionContent}
                  fallbackDescription={product.description}
                />

                {product.categories && product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {product.categories.map((category) => (
                      <Link
                        key={category.id}
                        to="/products"
                        search={{ categorySlugs: [category.slug] }}
                      >
                        <Badge
                          variant="outline"
                          className="bg-background hover:bg-muted rounded-md font-normal transition-colors"
                        >
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-10" />
          </div>

          {/* Right Sidebar Column matching yopem-old */}
          <div className="lg:w-[320px] lg:shrink-0">
            <div className="space-y-6 lg:sticky lg:top-8">
              <div className="border-border bg-card rounded-lg border p-5 shadow-2xs">
                <Button
                  size="lg"
                  className="w-full gap-2 font-medium"
                  onClick={handleUseApp}
                >
                  <PlayIcon className="size-4 fill-current" />
                  <span>Use App</span>
                </Button>

                <h3 className="text-foreground mt-6 mb-4 text-sm font-semibold tracking-tight">
                  App Details
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <ZapIcon className="size-4" />
                      <span>Availability</span>
                    </div>
                    <Badge
                      variant={cost > 0 ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {cost > 0 ? "Pro & Enterprise" : "All plans"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="size-4" />
                      <span>Last updated</span>
                    </div>
                    <span className="text-foreground font-medium">
                      {formattedDate}
                    </span>
                  </div>

                  {product.categories && product.categories.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <FolderIcon className="size-4" />
                        <span>Category</span>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {product.categories.slice(0, 1).map((category) => (
                          <Link
                            key={category.id}
                            to="/products"
                            search={{ categorySlugs: [category.slug] }}
                            className="text-foreground hover:text-primary font-medium transition-colors"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className="border-border/50 mt-5 space-y-3 border-t pt-5">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <TagIcon className="size-4" />
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <Link
                          key={tag.id}
                          to="/products"
                          search={{ tagSlugs: [tag.slug] }}
                        >
                          <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-md font-normal transition-colors"
                          >
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
