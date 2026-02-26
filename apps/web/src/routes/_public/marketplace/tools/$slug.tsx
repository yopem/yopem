import { createFileRoute } from "@tanstack/react-router"
import { siteTitle } from "@repo/env/client"
import { serverApi } from "@repo/orpc/server"
import { Badge } from "@repo/ui/badge"
import { Card, CardContent } from "@repo/ui/card"
import { Skeleton } from "@repo/ui/skeleton"
import { ArrowLeftIcon } from "lucide-react"
import { Suspense } from "react"

import { Link } from "@tanstack/react-router"
import ToolExecuteForm from "@/components/marketplace/execute-form"
import ToolInfo from "@/components/marketplace/tool-info"
import ToolReviewsSection from "@/components/marketplace/tool-reviews-section"
import UserCredits from "@/components/marketplace/user-credits"

export const Route = createFileRoute("/_public/marketplace/tools/$slug")({
  loader: async ({ params }) => {
    const [tool, reviewsData] = await Promise.all([
      serverApi.tools.getBySlug({ slug: params.slug }),
      serverApi.tools.getReviews({ slug: params.slug }),
    ])
    return {
      tool,
      reviewsData,
      slug: params.slug,
    }
  },
  head: ({ loaderData }) => {
    const tool = loaderData?.tool
    if (!tool) {
      return { meta: [{ title: "Tool Not Found" }] }
    }
    const title = `${tool.name} | ${siteTitle}`
    const description =
      tool.description ?? "Discover this AI-powered tool in our marketplace"
    return {
      meta: [
        { title: tool.name },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        {
          property: "og:url",
          content: `/marketplace/tools/${loaderData.slug}`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:card", content: "summary" },
      ],
      links: [
        { rel: "canonical", href: `/marketplace/tools/${loaderData.slug}` },
      ],
    }
  },
  notFoundComponent: () => <div>Tool not found</div>,
  component: ToolDetailPage,
})

function ToolDetailPage() {
  const { tool, reviewsData, slug } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const isAuthenticated = !!session

  if (!tool) {
    return <div>Tool not found</div>
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Link
        to="/marketplace"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center text-sm font-medium transition-colors"
      >
        <ArrowLeftIcon className="mr-2 size-4" />
        Back to Marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="rounded-md px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase"
              >
                {tool.status}
              </Badge>
              {tool.categories.slice(0, 2).map((category: { id: string; name: string }) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="border-border/50 bg-card rounded-md px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
            <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
              {tool.name}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-[600px] text-base/relaxed">
              {tool.description ?? "No description available"}
            </p>
          </div>

          <ToolExecuteForm
            toolId={tool.id}
            costPerRun={tool.costPerRun}
            inputVariable={tool.inputVariable ?? []}
            isAuthenticated={isAuthenticated}
          />

          <ToolReviewsSection
            slug={slug}
            reviews={reviewsData.reviews}
            isAuthenticated={isAuthenticated}
          />
        </div>

        <div className="h-fit space-y-6 lg:sticky lg:top-24">
          <ToolInfo tool={tool} />

          <Suspense
            fallback={
              <Card className="bg-card rounded-2xl border shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-14 w-full rounded-xl" />
                </CardContent>
              </Card>
            }
          >
            <UserCredits />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
