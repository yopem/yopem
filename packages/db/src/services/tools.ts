import { Result } from "better-result"
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"

import { createCustomId } from "shared/custom-id"

import type { InsertToolVersion } from "../schema/tool-versions.ts"
import type { InsertTool, SelectTool } from "../schema/tools.ts"

import { DatabaseOperationError, NotFoundError } from "../errors.ts"
import { db } from "../index.ts"
import {
  assetsTable,
  categoriesTable,
  tagsTable,
  toolCategoriesTable,
  toolReviewsTable,
  toolRunsTable,
  toolTagsTable,
  toolVersionsTable,
  toolsTable,
} from "../schema/index.ts"
import { generateUniqueToolSlug } from "./slug.ts"

export const listTools = (input?: {
  limit?: number
  cursor?: string
  search?: string
  categoryIds?: string[]
  status?: "draft" | "active" | "archived" | "all"
  priceFilter?: "all" | "free" | "paid"
  tagIds?: string[]
}): Promise<
  Result<
    {
      tools: {
        id: string
        slug: string
        name: string
        excerpt: string | null
        description: string | null
        status: "draft" | "active" | "archived"
        costPerRun: string | null
        createdAt: Date | null
        thumbnailId: string | null
        averageRating: number | null
        reviewCount: number
        categories: { id: string; name: string; slug: string }[]
        thumbnail: { id: string; url: string } | null
      }[]
      nextCursor?: string
    },
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
      const limit = input?.limit ?? 20
      const conditions = []

      if (input?.status && input.status !== "all") {
        conditions.push(eq(toolsTable.status, input.status))
      } else if (!input?.status) {
        conditions.push(eq(toolsTable.status, "active"))
      }

      if (input?.categoryIds && input.categoryIds.length > 0) {
        const toolsWithAllCategories = await db
          .select({ toolId: toolCategoriesTable.toolId })
          .from(toolCategoriesTable)
          .where(inArray(toolCategoriesTable.categoryId, input.categoryIds))
          .groupBy(toolCategoriesTable.toolId)
          .having(
            sql`COUNT(DISTINCT ${toolCategoriesTable.categoryId}) = ${input.categoryIds.length}`,
          )

        const toolIdsWithAllCategories = toolsWithAllCategories.map(
          (t) => t.toolId,
        )

        if (toolIdsWithAllCategories.length > 0) {
          conditions.push(inArray(toolsTable.id, toolIdsWithAllCategories))
        } else {
          conditions.push(sql`1 = 0`)
        }
      }

      if (input?.search) {
        conditions.push(
          sql`(${ilike(toolsTable.name, `%${input.search}%`).getSQL()} OR ${ilike(toolsTable.description, `%${input.search}%`).getSQL()})`,
        )
      }

      if (input?.priceFilter === "free") {
        conditions.push(eq(toolsTable.costPerRun, "0"))
      } else if (input?.priceFilter === "paid") {
        conditions.push(sql`${toolsTable.costPerRun} > 0`)
      }

      if (input?.tagIds && input.tagIds.length > 0) {
        const toolsWithAllTags = await db
          .select({ toolId: toolTagsTable.toolId })
          .from(toolTagsTable)
          .where(inArray(toolTagsTable.tagId, input.tagIds))
          .groupBy(toolTagsTable.toolId)
          .having(
            sql`COUNT(DISTINCT ${toolTagsTable.tagId}) = ${input.tagIds.length}`,
          )

        const toolIdsWithAllTags = toolsWithAllTags.map((t) => t.toolId)

        if (toolIdsWithAllTags.length > 0) {
          conditions.push(inArray(toolsTable.id, toolIdsWithAllTags))
        } else {
          conditions.push(sql`1 = 0`)
        }
      }

      const tools = await db
        .select({
          id: toolsTable.id,
          slug: toolsTable.slug,
          name: toolsTable.name,
          excerpt: toolsTable.excerpt,
          description: toolsTable.description,
          status: toolsTable.status,
          costPerRun: toolsTable.costPerRun,
          createdAt: toolsTable.createdAt,
          thumbnailId: toolsTable.thumbnailId,
          thumbnailUrl: assetsTable.url,
          thumbnailAssetId: assetsTable.id,
        })
        .from(toolsTable)
        .leftJoin(assetsTable, eq(toolsTable.thumbnailId, assetsTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(toolsTable.createdAt))
        .limit(limit + 1)

      const toolIds = tools.map((t) => t.id)

      const categoriesMap = new Map<
        string,
        { id: string; name: string; slug: string }[]
      >()
      if (toolIds.length > 0) {
        const toolCategories = await db
          .select({
            toolId: toolCategoriesTable.toolId,
            id: categoriesTable.id,
            name: categoriesTable.name,
            slug: categoriesTable.slug,
          })
          .from(toolCategoriesTable)
          .innerJoin(
            categoriesTable,
            eq(toolCategoriesTable.categoryId, categoriesTable.id),
          )
          .where(inArray(toolCategoriesTable.toolId, toolIds))

        for (const row of toolCategories) {
          if (!categoriesMap.has(row.toolId)) {
            categoriesMap.set(row.toolId, [])
          }
          categoriesMap
            .get(row.toolId)!
            .push({ id: row.id, name: row.name, slug: row.slug })
        }
      }

      const ratingsMap = new Map<
        string,
        { averageRating: number | null; reviewCount: number }
      >()
      if (toolIds.length > 0) {
        const ratings = await db
          .select({
            toolId: toolReviewsTable.toolId,
            avgRating: sql`AVG(${toolReviewsTable.rating})`,
            count: sql`COUNT(*)`,
          })
          .from(toolReviewsTable)
          .where(inArray(toolReviewsTable.toolId, toolIds))
          .groupBy(toolReviewsTable.toolId)

        for (const row of ratings) {
          const avg = row.avgRating ? Number(row.avgRating) : null
          ratingsMap.set(row.toolId, {
            averageRating: avg ? Math.round(avg * 10) / 10 : null,
            reviewCount: Number(row.count),
          })
        }
      }

      const toolsWithCategories = tools.map((tool) => {
        const thumbnail =
          tool.thumbnailAssetId && tool.thumbnailUrl
            ? { id: tool.thumbnailAssetId, url: tool.thumbnailUrl }
            : null

        const { thumbnailUrl: _, thumbnailAssetId: __, ...toolData } = tool
        const rating = ratingsMap.get(tool.id) ?? {
          averageRating: null,
          reviewCount: 0,
        }

        return {
          ...toolData,
          ...rating,
          categories: categoriesMap.get(tool.id) ?? [],
          thumbnail,
        }
      })

      let nextCursor: string | undefined = undefined
      if (toolsWithCategories.length > limit) {
        const nextItem = toolsWithCategories.pop()
        nextCursor = nextItem?.id
      }

      return { tools: toolsWithCategories, nextCursor }
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "list",
        table: "tools",
        cause: e,
      }),
  })
}

export const getToolById = async (
  id: string,
): Promise<Result<SelectTool, NotFoundError>> => {
  const [tool] = await db.select().from(toolsTable).where(eq(toolsTable.id, id))

  if (!tool) {
    return Result.err(new NotFoundError({ resource: "Tool", id }))
  }

  const [categoriesResult, tagsResult, thumbnailResult] = await Promise.all([
    db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      })
      .from(toolCategoriesTable)
      .innerJoin(
        categoriesTable,
        eq(toolCategoriesTable.categoryId, categoriesTable.id),
      )
      .where(eq(toolCategoriesTable.toolId, id)),
    db
      .select({ id: tagsTable.id, name: tagsTable.name, slug: tagsTable.slug })
      .from(toolTagsTable)
      .innerJoin(tagsTable, eq(toolTagsTable.tagId, tagsTable.id))
      .where(eq(toolTagsTable.toolId, id)),
    tool.thumbnailId
      ? db
          .select({
            id: assetsTable.id,
            url: assetsTable.url,
            originalName: assetsTable.originalName,
          })
          .from(assetsTable)
          .where(eq(assetsTable.id, tool.thumbnailId))
      : Promise.resolve([]),
  ])

  return Result.ok({
    ...tool,
    categories: categoriesResult,
    tags: tagsResult,
    thumbnail: thumbnailResult[0] ?? null,
  })
}

export const getToolBySlug = async (
  slug: string,
): Promise<Result<SelectTool, NotFoundError>> => {
  const tool = await db.query.toolsTable.findFirst({
    where: eq(toolsTable.slug, slug),
  })

  if (!tool) {
    return Result.err(new NotFoundError({ resource: "Tool", id: slug }))
  }

  const [categoriesResult, tagsResult, thumbnailResult, ratingResult] =
    await Promise.all([
      db
        .select({
          id: categoriesTable.id,
          name: categoriesTable.name,
          slug: categoriesTable.slug,
        })
        .from(toolCategoriesTable)
        .innerJoin(
          categoriesTable,
          eq(toolCategoriesTable.categoryId, categoriesTable.id),
        )
        .where(eq(toolCategoriesTable.toolId, tool.id)),
      db
        .select({
          id: tagsTable.id,
          name: tagsTable.name,
          slug: tagsTable.slug,
        })
        .from(toolTagsTable)
        .innerJoin(tagsTable, eq(toolTagsTable.tagId, tagsTable.id))
        .where(eq(toolTagsTable.toolId, tool.id)),
      tool.thumbnailId
        ? db
            .select({
              id: assetsTable.id,
              url: assetsTable.url,
              originalName: assetsTable.originalName,
            })
            .from(assetsTable)
            .where(eq(assetsTable.id, tool.thumbnailId))
        : Promise.resolve([]),
      db
        .select({
          avgRating: sql`AVG(${toolReviewsTable.rating})`,
          count: sql`COUNT(*)`,
        })
        .from(toolReviewsTable)
        .where(eq(toolReviewsTable.toolId, tool.id)),
    ])

  const avgRating = ratingResult[0]?.avgRating
    ? Number(ratingResult[0].avgRating)
    : null
  const reviewCount = Number(ratingResult[0]?.count ?? 0)

  return Result.ok({
    ...tool,
    categories: categoriesResult,
    tags: tagsResult,
    thumbnail: thumbnailResult[0] ?? null,
    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    reviewCount,
  })
}

export const createTool = (
  data: Omit<InsertTool, "id" | "slug"> & {
    categoryIds?: string[]
    tagIds?: string[]
  },
): Promise<Result<{ id: string; slug: string }, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      const { categoryIds, tagIds, ...toolData } = data
      const id = createCustomId()
      const slug = await generateUniqueToolSlug(toolData.name!)

      await db.insert(toolsTable).values({ ...toolData, id, slug })

      if (categoryIds && categoryIds.length > 0) {
        await db
          .insert(toolCategoriesTable)
          .values(categoryIds.map((categoryId) => ({ toolId: id, categoryId })))
      }

      if (tagIds && tagIds.length > 0) {
        await db
          .insert(toolTagsTable)
          .values(tagIds.map((tagId) => ({ toolId: id, tagId })))
      }

      return { id, slug }
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "insert",
        table: "tools",
        cause: e,
      }),
  })
}

export const updateTool = (
  id: string,
  data: Partial<InsertTool> & {
    categoryIds?: string[]
    tagIds?: string[]
  },
): Promise<Result<{ success: boolean }, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      const { categoryIds, tagIds, ...toolData } = data

      let slug: string | undefined
      if (toolData.name) {
        const [existingTool] = await db
          .select({ name: toolsTable.name })
          .from(toolsTable)
          .where(eq(toolsTable.id, id))

        if (existingTool && existingTool.name !== toolData.name) {
          slug = await generateUniqueToolSlug(toolData.name)
        }
      }

      await db
        .update(toolsTable)
        .set({
          ...toolData,
          ...(slug ? { slug } : {}),
          thumbnailId: toolData.thumbnailId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(toolsTable.id, id))

      if (categoryIds !== undefined) {
        await db
          .delete(toolCategoriesTable)
          .where(eq(toolCategoriesTable.toolId, id))

        if (categoryIds.length > 0) {
          await db
            .insert(toolCategoriesTable)
            .values(
              categoryIds.map((categoryId) => ({ toolId: id, categoryId })),
            )
        }
      }

      if (tagIds !== undefined) {
        await db.delete(toolTagsTable).where(eq(toolTagsTable.toolId, id))

        if (tagIds.length > 0) {
          await db
            .insert(toolTagsTable)
            .values(tagIds.map((tagId) => ({ toolId: id, tagId })))
        }
      }

      return { success: true }
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "update",
        table: "tools",
        cause: e,
      }),
  })
}

export const deleteTool = (
  id: string,
): Promise<Result<void, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      await db.delete(toolsTable).where(eq(toolsTable.id, id))
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "delete",
        table: "tools",
        cause: e,
      }),
  })
}

export const duplicateTool = async (
  sourceId: string,
  createdBy: string,
): Promise<Result<{ id: string }, NotFoundError>> => {
  const [tool] = await db
    .select()
    .from(toolsTable)
    .where(eq(toolsTable.id, sourceId))

  if (!tool) {
    return Result.err(new NotFoundError({ resource: "Tool", id: sourceId }))
  }

  const newId = createCustomId()
  const duplicateName = `${tool.name} (Copy)`
  const slug = await generateUniqueToolSlug(duplicateName)

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    slug: _slug,
    ...toolData
  } = tool

  await db.insert(toolsTable).values({
    ...toolData,
    id: newId,
    name: duplicateName,
    slug,
    createdBy,
    status: "draft",
  })

  return Result.ok({ id: newId })
}

export const updateToolStatus = (
  ids: string[],
  status: "draft" | "active" | "archived",
): Promise<
  Result<{ success: boolean; count: number }, DatabaseOperationError>
> => {
  return Result.tryPromise({
    try: async () => {
      await db
        .update(toolsTable)
        .set({ status, updatedAt: new Date() })
        .where(inArray(toolsTable.id, ids))

      return { success: true, count: ids.length }
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "update",
        table: "tools",
        cause: e,
      }),
  })
}

export const getToolVersions = (
  toolId: string,
): Promise<
  Result<(typeof toolVersionsTable.$inferSelect)[], DatabaseOperationError>
> => {
  return Result.tryPromise({
    try: () => {
      return db
        .select()
        .from(toolVersionsTable)
        .where(eq(toolVersionsTable.toolId, toolId))
        .orderBy(desc(toolVersionsTable.version))
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tool_versions",
        cause: e,
      }),
  })
}

export const createToolVersion = (
  toolId: string,
  data: Omit<InsertToolVersion, "id" | "toolId">,
): Promise<
  Result<typeof toolVersionsTable.$inferSelect, DatabaseOperationError>
> => {
  return Result.tryPromise({
    try: async () => {
      const [versions] = await db
        .select({
          maxVersion: sql<number>`COALESCE(MAX(${toolVersionsTable.version}), 0)`,
        })
        .from(toolVersionsTable)
        .where(eq(toolVersionsTable.toolId, toolId))

      const nextVersion = Number(versions?.maxVersion ?? 0) + 1

      const [version] = await db
        .insert(toolVersionsTable)
        .values({ ...data, toolId, version: nextVersion })
        .returning()

      if (!version) {
        throw new Error("Insert returned no rows")
      }

      return version
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "insert",
        table: "tool_versions",
        cause: e,
      }),
  })
}

export const getPopularTools = (
  limit = 10,
): Promise<
  Result<
    {
      id: string
      slug: string
      name: string
      description: string | null
      costPerRun: string | null
      thumbnailId: string | null
      thumbnail: { id: string; url: string } | null
    }[],
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
      const tools = await db
        .select({
          id: toolsTable.id,
          slug: toolsTable.slug,
          name: toolsTable.name,
          description: toolsTable.description,
          costPerRun: toolsTable.costPerRun,
          thumbnailId: toolsTable.thumbnailId,
          thumbnailUrl: assetsTable.url,
          thumbnailAssetId: assetsTable.id,
        })
        .from(toolsTable)
        .leftJoin(assetsTable, eq(toolsTable.thumbnailId, assetsTable.id))
        .where(eq(toolsTable.status, "active"))
        .limit(limit)

      return tools.map((tool) => {
        const thumbnail =
          tool.thumbnailAssetId && tool.thumbnailUrl
            ? { id: tool.thumbnailAssetId, url: tool.thumbnailUrl }
            : null

        const { thumbnailUrl: _, thumbnailAssetId: __, ...toolData } = tool

        return { ...toolData, thumbnail }
      })
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tools",
        cause: e,
      }),
  })
}

export const getToolBySlugId = async (
  slug: string,
): Promise<Result<{ id: string }, NotFoundError>> => {
  const [tool] = await db
    .select({ id: toolsTable.id })
    .from(toolsTable)
    .where(eq(toolsTable.slug, slug))

  if (!tool) {
    return Result.err(new NotFoundError({ resource: "Tool", id: slug }))
  }

  return Result.ok(tool)
}

export const getToolReviews = (
  toolId: string,
): Promise<
  Result<
    {
      reviews: {
        id: string
        rating: number
        reviewText: string | null
        createdAt: Date | null
        userId: string
        userName: string | null
      }[]
      averageRating: number | null
      reviewCount: number
    },
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
      const reviews = await db
        .select({
          id: toolReviewsTable.id,
          rating: toolReviewsTable.rating,
          reviewText: toolReviewsTable.reviewText,
          createdAt: toolReviewsTable.createdAt,
          userId: toolReviewsTable.userId,
          userName: toolReviewsTable.userName,
        })
        .from(toolReviewsTable)
        .where(eq(toolReviewsTable.toolId, toolId))
        .orderBy(desc(toolReviewsTable.createdAt))

      const [avgRatingResult] = await db
        .select({
          avgRating: sql`AVG(${toolReviewsTable.rating})`,
          count: sql`COUNT(*)`,
        })
        .from(toolReviewsTable)
        .where(eq(toolReviewsTable.toolId, toolId))

      const avgRating = avgRatingResult?.avgRating
        ? Number(avgRatingResult.avgRating)
        : null
      const reviewCount = Number(avgRatingResult?.count ?? 0)

      return {
        reviews,
        averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount,
      }
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tool_reviews",
        cause: e,
      }),
  })
}

export const getUserReview = (
  toolId: string,
  userId: string,
): Promise<
  Result<typeof toolReviewsTable.$inferSelect | null, DatabaseOperationError>
> => {
  return Result.tryPromise({
    try: async () => {
      const [review] = await db
        .select()
        .from(toolReviewsTable)
        .where(
          and(
            eq(toolReviewsTable.toolId, toolId),
            eq(toolReviewsTable.userId, userId),
          ),
        )

      return review ?? null
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tool_reviews",
        cause: e,
      }),
  })
}

export const upsertToolReview = (
  toolId: string,
  userId: string,
  userName: string | null,
  rating: number,
  reviewText: string | null,
): Promise<Result<{ existing: boolean }, DatabaseOperationError>> => {
  return Result.gen(async function* () {
    const existingResult = yield* await getUserReview(toolId, userId)

    if (existingResult) {
      yield* await Result.tryPromise({
        try: async () => {
          await db
            .update(toolReviewsTable)
            .set({ rating, reviewText, updatedAt: new Date() })
            .where(eq(toolReviewsTable.id, existingResult.id))
        },
        catch: (e) =>
          new DatabaseOperationError({
            operation: "update",
            table: "tool_reviews",
            cause: e,
          }),
      })

      return Result.ok({ existing: true })
    }

    const id = createCustomId()
    yield* await Result.tryPromise({
      try: async () => {
        await db
          .insert(toolReviewsTable)
          .values({ id, toolId, userId, userName, rating, reviewText })
      },
      catch: (e) =>
        new DatabaseOperationError({
          operation: "insert",
          table: "tool_reviews",
          cause: e,
        }),
    })

    return Result.ok({ existing: false })
  })
}

export const updateToolReview = (
  reviewId: string,
  rating: number,
  reviewText: string | null,
): Promise<Result<void, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      await db
        .update(toolReviewsTable)
        .set({ rating, reviewText, updatedAt: new Date() })
        .where(eq(toolReviewsTable.id, reviewId))
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "update",
        table: "tool_reviews",
        cause: e,
      }),
  })
}

export const getToolReviewById = (
  reviewId: string,
): Promise<
  Result<typeof toolReviewsTable.$inferSelect | null, DatabaseOperationError>
> => {
  return Result.tryPromise({
    try: async () => {
      const [review] = await db
        .select()
        .from(toolReviewsTable)
        .where(eq(toolReviewsTable.id, reviewId))

      return review ?? null
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tool_reviews",
        cause: e,
      }),
  })
}

export const hasUserUsedTool = (
  toolId: string,
  userId: string,
): Promise<Result<boolean, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      const [result] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(toolRunsTable)
        .where(
          and(
            eq(toolRunsTable.toolId, toolId),
            eq(toolRunsTable.userId, userId),
            eq(toolRunsTable.status, "completed"),
          ),
        )

      return Number(result?.count) > 0
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tool_runs",
        cause: e,
      }),
  })
}

export const insertToolRun = (data: {
  id: string
  toolId: string
  userId: string
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  status: "running" | "completed" | "failed"
  cost: string
  completedAt: Date
}): Promise<
  Result<typeof toolRunsTable.$inferSelect, DatabaseOperationError>
> => {
  return Result.tryPromise({
    try: async () => {
      const [run] = await db.insert(toolRunsTable).values(data).returning()
      if (!run) {
        throw new Error("Insert returned no rows")
      }
      return run
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "insert",
        table: "tool_runs",
        cause: e,
      }),
  })
}

export const updateToolRun = (
  id: string,
  data: {
    outputs: Record<string, unknown>
    status: "running" | "completed" | "failed"
    completedAt: Date
  },
): Promise<
  Result<typeof toolRunsTable.$inferSelect, DatabaseOperationError>
> => {
  return Result.tryPromise({
    try: async () => {
      const [run] = await db
        .update(toolRunsTable)
        .set(data)
        .where(eq(toolRunsTable.id, id))
        .returning()
      if (!run) {
        throw new Error("Update returned no rows")
      }
      return run
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "update",
        table: "tool_runs",
        cause: e,
      }),
  })
}

export const searchTools = (
  query: string,
  limit = 20,
): Promise<
  Result<
    {
      id: string
      slug: string
      name: string
      excerpt: string | null
      costPerRun: string | null
      thumbnail: { id: string; url: string } | null
    }[],
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
      const tools = await db
        .select({
          id: toolsTable.id,
          slug: toolsTable.slug,
          name: toolsTable.name,
          excerpt: toolsTable.excerpt,
          costPerRun: toolsTable.costPerRun,
          thumbnailUrl: assetsTable.url,
          thumbnailAssetId: assetsTable.id,
        })
        .from(toolsTable)
        .leftJoin(assetsTable, eq(toolsTable.thumbnailId, assetsTable.id))
        .where(
          and(
            eq(toolsTable.status, "active"),
            sql`(${ilike(toolsTable.name, `%${query}%`).getSQL()} OR ${ilike(toolsTable.description, `%${query}%`).getSQL()})`,
          ),
        )
        .orderBy(desc(toolsTable.createdAt))
        .limit(limit)

      return tools.map((tool) => {
        const thumbnail =
          tool.thumbnailAssetId && tool.thumbnailUrl
            ? { id: tool.thumbnailAssetId, url: tool.thumbnailUrl }
            : null

        const { thumbnailUrl: _, thumbnailAssetId: __, ...toolData } = tool

        return { ...toolData, thumbnail }
      })
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tools",
        cause: e,
      }),
  })
}
