import { Suspense } from "react"
import { desc, eq } from "drizzle-orm"

import MarketplaceGrid from "@/components/marketplace/marketplace-grid"
import { db } from "@/lib/db"
import { toolsTable } from "@/lib/db/schema"

async function getInitialTools() {
  "use server"
  const tools = await db
    .select({
      id: toolsTable.id,
      name: toolsTable.name,
      description: toolsTable.description,
      status: toolsTable.status,
      costPerRun: toolsTable.costPerRun,
      categoryId: toolsTable.categoryId,
      createdAt: toolsTable.createdAt,
    })
    .from(toolsTable)
    .where(eq(toolsTable.status, "active"))
    .orderBy(desc(toolsTable.createdAt))
    .limit(21)

  return {
    tools: tools.map((t) => ({
      ...t,
      createdAt: t.createdAt,
    })),
  }
}

export default async function MarketplacePage() {
  const { tools } = await getInitialTools()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Tools Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Discover and use AI-powered tools for your workflows
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
            ))}
          </div>
        }
      >
        <MarketplaceGrid initialTools={tools} />
      </Suspense>
    </div>
  )
}
