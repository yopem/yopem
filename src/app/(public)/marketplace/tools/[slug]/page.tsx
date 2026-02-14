import { ArrowLeftIcon, SparklesIcon } from "lucide-react"
import { type Metadata } from "next"
import Image from "next/image"
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
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="from-primary/10 via-primary/5 relative overflow-hidden rounded-2xl bg-linear-to-br to-transparent p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={tool.status === "active" ? "default" : "secondary"}
                  className={
                    tool.status === "active"
                      ? "bg-green-500 hover:bg-green-600"
                      : ""
                  }
                >
                  <SparklesIcon className="mr-1 size-3" />
                  {tool.status}
                </Badge>
                {tool.categories.slice(0, 2).map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {tool.name}
              </h1>
              <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                {tool.description ??
                  "Execute this tool to get AI-powered results"}
              </p>
              <div className="flex items-center gap-4 pt-2 text-sm">
                <span className="text-muted-foreground">
                  {Number(tool.costPerRun ?? 0) > 0
                    ? `${tool.costPerRun} credits/run`
                    : "Free to use"}
                </span>
              </div>
            </div>
            {tool.thumbnail && (
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl md:size-32">
                <Image
                  src={tool.thumbnail.url}
                  alt={`${tool.name} thumbnail`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <ToolExecuteForm toolId={tool.id} costPerRun={tool.costPerRun} />
      </div>

      <div className="space-y-6">
        <ToolInfo tool={tool} />

        <Suspense
          fallback={
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
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
    <div className="container mx-auto max-w-6xl py-8">
      <Link
        href="/marketplace"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center text-sm transition-colors"
      >
        <ArrowLeftIcon className="mr-2 size-4" />
        Back to Marketplace
      </Link>

      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        }
      >
        <ToolData slug={slug} />
      </Suspense>
    </div>
  )
}
