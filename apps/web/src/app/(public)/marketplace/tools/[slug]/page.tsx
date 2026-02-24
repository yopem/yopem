import { auth } from "@repo/auth/session"
import { siteTitle } from "@repo/env/client"
import { serverApi } from "@repo/orpc/server"
import { Badge } from "@repo/ui/badge"
import { Card, CardContent } from "@repo/ui/card"
import Link from "@/components/link"
import { Skeleton } from "@repo/ui/skeleton"
import { type ToolInputVariable } from "@repo/ui/tool-input-field"
import { ArrowLeftIcon } from "lucide-react"
import { type Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { cache, Suspense } from "react"

import ToolExecuteForm from "./execute-form"
import ToolInfo from "./tool-info"
import ToolReviewsSection from "./tool-reviews-section"
import UserCredits from "./user-credits"

export async function generateStaticParams() {
  try {
    const result = await serverApi.tools.list({ limit: 1000 })
    return result.tools.map((tool: { slug: string }) => ({ slug: tool.slug }))
  } catch {
    return []
  }
}

const getToolBySlug = cache(async (slug: string) => {
  await connection()
  return serverApi.tools.getBySlug({ slug })
})

const getReviewsBySlug = cache(async (slug: string) => {
  await connection()
  return serverApi.tools.getReviews({ slug })
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    const tool = await getToolBySlug(slug)

    if (!tool) {
      return {
        title: "Tool Not Found",
      }
    }

    const title = `${tool.name} | ${siteTitle}`
    const description =
      tool.description ?? "Discover this AI-powered tool in our marketplace"
    const url = `/marketplace/tools/${slug}`

    return {
      title: tool.name,
      description,
      openGraph: {
        title,
        description,
        url,
        type: "website",
      },
      twitter: {
        title,
        description,
        card: "summary",
      },
      alternates: {
        canonical: url,
      },
    }
  } catch {
    return {
      title: "Tool Not Found",
    }
  }
}

async function ToolData({ slug }: { slug: string }) {
  const [tool, reviewsData] = await Promise.all([
    getToolBySlug(slug),
    getReviewsBySlug(slug),
  ])

  if (!tool) {
    notFound()
  }

  const session = await auth()

  return (
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
            {tool.categories.slice(0, 2).map((category) => (
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
          inputVariable={tool.inputVariable as ToolInputVariable[]}
          isAuthenticated={!!session}
        />

        <ToolReviewsSection
          slug={slug}
          reviews={reviewsData.reviews}
          isAuthenticated={!!session}
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
  )
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Link
        href="/marketplace"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center text-sm font-medium transition-colors"
      >
        <ArrowLeftIcon className="mr-2 size-4" />
        Back to Marketplace
      </Link>

      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded-md" />
                <Skeleton className="h-10 w-3/4 rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
              <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        }
      >
        <ToolData slug={slug} />
      </Suspense>
    </div>
  )
}
