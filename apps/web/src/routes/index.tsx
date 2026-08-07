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
import { Button } from "ui/button"
import { Card, CardPanel, CardTitle } from "ui/card"

import { SiteLayout } from "@/components/site-layout"
import { ProductCard } from "@/features/storefront/product-card"

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

const values = [
  {
    icon: ZapIcon,
    title: "Fast Execution",
    description: "Instant cloud inference workflows",
  },
  {
    icon: LayersIcon,
    title: "Curated Tools",
    description: "Purpose-built AI micro-utilities",
  },
  {
    icon: ShieldCheckIcon,
    title: "Reliable",
    description: "Automated state preservation",
  },
]

function LandingComponent() {
  const { popular, categories } = useLoaderData({ from: "/" })

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-border bg-background border-b py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-5 px-4 text-center sm:px-6">
          <h1 className="font-heading text-foreground text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Supercharge your workflow with AI micro-tools
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">
            Access curated AI micro-tools, generate high-quality output in
            seconds, and seamlessly automate complex tasks.
          </p>

          <div className="pt-1">
            <Button
              size="lg"
              className="w-full gap-2 px-6 text-sm font-semibold sm:w-auto"
              render={<Link to="/products" />}
            >
              <CompassIcon className="size-4" />
              <span>Explore All Tools</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Value bar */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-border bg-card flex items-start gap-3 p-4 shadow-2xs"
            >
              <Icon className="text-foreground mt-0.5 size-4 shrink-0" />
              <CardPanel className="flex-1 p-0">
                <CardTitle className="font-heading text-xs font-semibold">
                  {title}
                </CardTitle>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {description}
                </p>
              </CardPanel>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular Products Grid */}
      <section className="mx-auto max-w-6xl space-y-5 px-4 py-12 sm:px-6">
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
          <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">
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
