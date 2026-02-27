import { siteTitle } from "@repo/env/client"
import { serverApi } from "@repo/orpc/server"
import { Badge } from "@repo/ui/badge"
import { Separator } from "@repo/ui/separator"
import { Skeleton } from "@repo/ui/skeleton"
import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"
import { Suspense } from "react"

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
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-y-4 sm:flex-row sm:items-start sm:gap-x-6">
            <div className="bg-muted border-border flex size-16 shrink-0 items-center justify-center rounded-2xl border sm:size-20">
              <span className="text-foreground text-3xl font-semibold">
                {tool.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                  {tool.name}
                </h1>
                <Badge variant="secondary" className="rounded-md font-medium">
                  {tool.status}
                </Badge>
              </div>

              <p className="text-muted-foreground text-base leading-relaxed">
                {tool.description ?? "No description available"}
              </p>

              {tool.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tool.categories.map(
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
                Run this tool
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter the required parameters to execute this tool.
              </p>
            </div>
            <ToolExecuteForm
              toolId={tool.id}
              costPerRun={tool.costPerRun}
              inputVariable={tool.inputVariable ?? []}
              isAuthenticated={isAuthenticated}
            />
          </section>
        </div>

        <div className="lg:w-[320px] lg:shrink-0">
          <div className="space-y-6 lg:sticky lg:top-8">
            <ToolInfo tool={tool} />

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
        <ToolReviewsSection
          slug={slug}
          reviews={reviewsData.reviews}
          isAuthenticated={isAuthenticated}
          currentUserName={
            session
              ? (session.username ?? session.name ?? null)
              : null
          }
        />
      </section>
    </div>
  )
}
