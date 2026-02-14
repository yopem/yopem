import { ArrowLeftIcon } from "lucide-react"
import { type Metadata } from "next"
import { notFound } from "next/navigation"
import { cache, Suspense } from "react"

import Link from "@/components/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { siteTitle } from "@/lib/env/client"
import { serverApi } from "@/lib/orpc/server"

import ToolExecuteForm from "./execute-form"
import ToolInfo from "./tool-info"
import UserCredits from "./user-credits"

const getToolBySlug = cache((slug: string) => {
  return serverApi.tools.getBySlug({ slug })
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
  const tool = await getToolBySlug(slug)

  if (!tool) {
    notFound()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {tool.status}
            </Badge>
            {tool.categories.slice(0, 2).map((category) => (
              <Badge key={category.id} variant="outline" className="text-xs">
                {category.name}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {tool.name}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {tool.description ?? "No description available"}
          </p>
        </div>

        <ToolExecuteForm toolId={tool.id} costPerRun={tool.costPerRun} />
      </div>

      <div className="space-y-4">
        <ToolInfo tool={tool} />

        <Suspense
          fallback={
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-14 w-full" />
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
    <div className="container mx-auto max-w-5xl py-6">
      <Link
        href="/marketplace"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center text-sm"
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        Back
      </Link>

      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        }
      >
        <ToolData slug={slug} />
      </Suspense>
    </div>
  )
}
