import { ArrowLeftIcon, CreditCardIcon } from "lucide-react"
import { type Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import Link from "@/components/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShimmerWrapper } from "@/components/ui/shimmer-wrapper"
import { Skeleton } from "@/components/ui/skeleton"
import { siteTitle } from "@/lib/env/client"
import { serverApi } from "@/lib/orpc/server"

import ToolExecuteForm from "./execute-form"
import UserCredits from "./user-credits"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    const tool = await serverApi.tools.getBySlug({ slug })

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
  const tool = await serverApi.tools.getBySlug({ slug })

  if (!tool) {
    notFound()
  }

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{tool.name}</span>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                tool.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {tool.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {tool.description ?? "No description available"}
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center">
              <CreditCardIcon className="mr-1 size-4" />
              {Number(tool.costPerRun ?? 0) > 0
                ? `${tool.costPerRun} credits/run`
                : "Free"}
            </span>
          </div>
        </CardContent>
      </Card>

      <ToolExecuteForm toolId={tool.id} costPerRun={tool.costPerRun} />

      <Suspense
        fallback={
          <ShimmerWrapper>
            <Skeleton className="h-16 w-full" />
          </ShimmerWrapper>
        }
      >
        <UserCredits />
      </Suspense>
    </>
  )
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Link
        href="/marketplace"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center text-sm"
      >
        <ArrowLeftIcon className="mr-2 size-4" />
        Back to Marketplace
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tool Details</h1>
        <p className="text-muted-foreground mt-2">
          View details and execute this tool.
        </p>
      </div>

      <Suspense
        fallback={
          <ShimmerWrapper>
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          </ShimmerWrapper>
        }
      >
        <ToolData slug={slug} />
      </Suspense>
    </div>
  )
}
