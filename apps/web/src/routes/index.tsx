import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router"
import {
  ArrowRightIcon,
  CompassIcon,
  LayersIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react"

import { siteDescription, siteTitle, siteUrl } from "env"
import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"

import { ProductCard } from "@/components/product-card"
import { SiteLayout } from "@/components/site-layout"

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }) => {
    const [popular, categories] = await Promise.all([
      queryClient.ensureQueryData(queryApi.products.popular.queryOptions()),
      queryClient.ensureQueryData(queryApi.products.categories.queryOptions()),
    ])
    return { popular, categories }
  },
  head: () => ({
    meta: [
      { title: `${siteTitle || "Yopem"} - AI Tools & Automated Workflows` },
      {
        name: "description",
        content:
          siteDescription ||
          "Discover and run powerful AI tools for content generation, media processing, and automated workflows.",
      },
      { property: "og:title", content: siteTitle || "Yopem AI Tools" },
      {
        property: "og:description",
        content: siteDescription || "Discover and run powerful AI tools.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl || "http://localhost:3000" },
    ],
    links: [{ rel: "canonical", href: siteUrl || "http://localhost:3000" }],
  }),
  component: LandingComponent,
})

function LandingComponent() {
  const { popular, categories } = useLoaderData({ from: "/" })

  return (
    <SiteLayout>
      {/* Hero Section - Clean cal.com minimal style */}
      <section className="border-border bg-background border-b py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-6 px-4 text-center sm:px-6">
          <Badge
            variant="outline"
            className="text-muted-foreground border-border px-3 py-1 text-xs font-medium"
          >
            <span>Next-Generation AI Platform</span>
          </Badge>

          <h1 className="font-heading text-foreground text-4xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Supercharge your workflow with AI micro-tools
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">
            Access curated AI micro-tools, generate high-quality output in
            seconds, and seamlessly automate complex tasks.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Button
              size="lg"
              className="w-full gap-2 px-6 text-sm font-semibold sm:w-auto"
              render={<Link to="/products" />}
            >
              <CompassIcon className="size-4" />
              <span>Explore All Tools</span>
            </Button>
            {categories.length > 0 && (
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 px-6 text-sm sm:w-auto"
                render={
                  <Link
                    to="/c/$categorySlug"
                    params={{ categorySlug: categories[0].slug }}
                  />
                }
              >
                <span>View Categories</span>
                <ArrowRightIcon className="size-4" />
              </Button>
            )}
          </div>

          {/* Key Value Highlights */}
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 pt-12 text-left sm:grid-cols-3">
            <div className="border-border bg-card flex items-start gap-3 rounded-lg border p-3.5 shadow-2xs">
              <ZapIcon className="text-foreground mt-0.5 size-4 shrink-0" />
              <div>
                <h4 className="font-heading text-xs font-semibold">
                  Fast Execution
                </h4>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Instant cloud inference workflows
                </p>
              </div>
            </div>
            <div className="border-border bg-card flex items-start gap-3 rounded-lg border p-3.5 shadow-2xs">
              <LayersIcon className="text-foreground mt-0.5 size-4 shrink-0" />
              <div>
                <h4 className="font-heading text-xs font-semibold">
                  Curated Tools
                </h4>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Purpose-built AI micro-utilities
                </p>
              </div>
            </div>
            <div className="border-border bg-card flex items-start gap-3 rounded-lg border p-3.5 shadow-2xs">
              <ShieldCheckIcon className="text-foreground mt-0.5 size-4 shrink-0" />
              <div>
                <h4 className="font-heading text-xs font-semibold">Reliable</h4>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Automated state preservation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products Grid */}
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Popular AI Tools
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Trending tools used by creators and developers
            </p>
          </div>
          <Link
            to="/products"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors"
          >
            <span>Browse All</span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>

        {popular.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-xs">
            No tools available yet. Check back soon!
          </div>
        )}
      </section>

      {/* Category Entry Links */}
      {categories.length > 0 && (
        <section className="border-border bg-muted/20 border-t py-12">
          <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight">
                Explore by Category
              </h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Find the right AI tool for your workflow
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to="/c/$categorySlug"
                  params={{ categorySlug: category.slug }}
                  className="group border-border bg-card hover:border-foreground/30 flex flex-col justify-between rounded-lg border p-4 shadow-2xs transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-heading text-foreground group-hover:text-foreground text-sm font-semibold transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="text-muted-foreground group-hover:text-foreground mt-3 flex items-center justify-end text-xs font-medium transition-colors">
                    <ArrowRightIcon className="size-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  )
}
