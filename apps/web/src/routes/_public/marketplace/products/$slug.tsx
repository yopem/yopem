import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"
import { Suspense } from "react"

import { siteTitle } from "env"
import { HydrateClient } from "rpc/hydration"
import { prefetchQueries } from "rpc/prefetch"
import { queryApi } from "rpc/query"
import { serverQueryApi } from "rpc/server-query"
import { Badge } from "ui/badge"
import { Separator } from "ui/separator"
import { Skeleton } from "ui/skeleton"

import ProductExecuteForm from "@/components/marketplace/execute-form"
import ProductInfo from "@/components/marketplace/product-info"
import ProductReviewsSection from "@/components/marketplace/product-reviews-section"
import UserCredits from "@/components/marketplace/user-credits"

export const Route = createFileRoute("/_public/marketplace/products/$slug")({
  loader: async ({ params, context }) => {
    const queries = [
      serverQueryApi.products.getBySlug.queryOptions({
        input: { slug: params.slug },
      }),
      serverQueryApi.products.getReviews.queryOptions({
        input: { slug: params.slug },
      }),
      serverQueryApi.user.getSubscription.queryOptions(),
      ...(context.session
        ? [
            serverQueryApi.products.hasUsedProduct.queryOptions({
              input: { slug: params.slug },
            }),
          ]
        : []),
    ]
    const dehydratedState = await prefetchQueries(context.queryClient, queries)

    const product = context.queryClient.getQueryData(
      serverQueryApi.products.getBySlug.queryOptions({
        input: { slug: params.slug },
      }).queryKey,
    )

    return {
      dehydratedState,
      product,
      slug: params.slug,
      hasUsedProduct: !!context.session,
    }
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product
    if (!product) {
      return { meta: [{ title: "Product Not Found" }] }
    }
    const title = `${product.name} | ${siteTitle}`
    const description =
      product.description ??
      "Discover this AI-powered product in our marketplace"
    return {
      meta: [
        { title: product.name },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        {
          property: "og:url",
          content: `/marketplace/products/${loaderData.slug}`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:card", content: "summary" },
      ],
      links: [
        {
          rel: "canonical",
          href: `/marketplace/products/${loaderData.slug}`,
        },
      ],
    }
  },
  notFoundComponent: () => <div>Product not found</div>,
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { dehydratedState, slug, hasUsedProduct } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const isAuthenticated = !!session

  const { data: product } = useQuery({
    ...queryApi.products.getBySlug.queryOptions({ input: { slug } }),
  })
  const { data: reviewsData } = useQuery({
    ...queryApi.products.getReviews.queryOptions({ input: { slug } }),
  })

  if (!product || !reviewsData) {
    return <div>Product not found</div>
  }

  return (
    <HydrateClient state={dehydratedState}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/marketplace"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors"
          >
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to apps
          </Link>
        </div>

        <div className="flex flex-col gap-y-10 lg:flex-row lg:gap-x-12">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-y-4 sm:flex-row sm:items-start sm:gap-x-6">
              <div className="bg-muted border-border flex size-16 shrink-0 items-center justify-center rounded-2xl border sm:size-20">
                <span className="text-foreground text-3xl font-semibold">
                  {product.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                    {product.name}
                  </h1>
                  <Badge variant="secondary" className="rounded-md font-medium">
                    {product.status}
                  </Badge>
                </div>

                <p className="text-muted-foreground text-base/relaxed">
                  {product.description ?? "No description available"}
                </p>

                {product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {product.categories.map(
                      (category: { id: string; name: string }) => (
                        <Badge
                          key={category.id}
                          variant="outline"
                          className="bg-background rounded-md font-normal"
                        >
                          {category.name}
                        </Badge>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-10" />

            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-foreground text-xl font-semibold tracking-tight">
                  Run this product
                </h2>
                <p className="text-muted-foreground text-sm">
                  Enter the required parameters to execute this product.
                </p>
              </div>
              <ProductExecuteForm
                productId={product.id}
                costPerRun={product.costPerRun}
                inputVariable={product.inputVariable ?? []}
                isAuthenticated={isAuthenticated}
              />
            </section>
          </div>

          <div className="lg:w-[320px] lg:shrink-0">
            <div className="space-y-6 lg:sticky lg:top-8">
              <ProductInfo product={product} />

              <Suspense
                fallback={
                  <div className="border-border bg-card rounded-lg border p-5 shadow-sm">
                    <Skeleton className="h-14 w-full rounded-md" />
                  </div>
                }
              >
                <UserCredits />
              </Suspense>
            </div>
          </div>
        </div>

        <Separator className="my-10" />

        <section>
          <ProductReviewsSection
            slug={slug}
            reviews={reviewsData.reviews}
            isAuthenticated={isAuthenticated}
            hasUsedProduct={hasUsedProduct}
            currentUserName={
              session ? (session.username ?? session.name ?? null) : null
            }
          />
        </section>
      </div>
    </HydrateClient>
  )
}
