import { createCustomId } from "@repo/utils/custom-id"
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"

import { db } from "../index"
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
} from "../schema"
import type { InsertToolVersion } from "../schema/tool-versions"
import type { InsertTool } from "../schema/tools"

import { generateUniqueToolSlug } from "./slug"

export const listTools = async (input?: {
  limit?: number
  cursor?: string
  search?: string
  categoryIds?: string[]
  status?: "draft" | "active" | "archived" | "all"
  priceFilter?: "all" | "free" | "paid"
  tagIds?: string[]
}) => {
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

    const toolIdsWithAllCategories = toolsWithAllCategories.map((t) => t.toolId)

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
}

export const getToolById = async (id: string) => {
  const [tool] = await db.select().from(toolsTable).where(eq(toolsTable.id, id))

  if (!tool) return undefined

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

  return {
    ...tool,
    categories: categoriesResult,
    tags: tagsResult,
    thumbnail: thumbnailResult[0] ?? null,
  }
}

export const getToolBySlug = async (slug: string) => {
  const tool = await db.query.toolsTable.findFirst({
    where: eq(toolsTable.slug, slug),
  })

  if (!tool) return undefined

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

  return {
    ...tool,
    categories: categoriesResult,
    tags: tagsResult,
    thumbnail: thumbnailResult[0] ?? null,
    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    reviewCount,
  }
}

export const createTool = async (
  data: Omit<InsertTool, "id" | "slug"> & {
    categoryIds?: string[]
    tagIds?: string[]
  },
) => {
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
}

export const updateTool = async (
  id: string,
  data: Partial<InsertTool> & {
    categoryIds?: string[]
    tagIds?: string[]
  },
) => {
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
        .values(categoryIds.map((categoryId) => ({ toolId: id, categoryId })))
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
}

export const deleteTool = async (id: string) => {
  await db.delete(toolsTable).where(eq(toolsTable.id, id))
}

export const duplicateTool = async (sourceId: string, createdBy: string) => {
  const [tool] = await db
    .select()
    .from(toolsTable)
    .where(eq(toolsTable.id, sourceId))

  if (!tool) return undefined

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

  return { id: newId }
}

export const updateToolStatus = async (
  ids: string[],
  status: "draft" | "active" | "archived",
) => {
  await db
    .update(toolsTable)
    .set({ status, updatedAt: new Date() })
    .where(inArray(toolsTable.id, ids))

  return { success: true, count: ids.length }
}

export const getToolVersions = (toolId: string) => {
  return db
    .select()
    .from(toolVersionsTable)
    .where(eq(toolVersionsTable.toolId, toolId))
    .orderBy(desc(toolVersionsTable.version))
}

export const createToolVersion = async (
  toolId: string,
  data: Omit<InsertToolVersion, "id" | "toolId">,
) => {
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

  return version
}

export const getPopularTools = async (limit = 10) => {
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
}

export const getToolBySlugId = async (slug: string) => {
  const [tool] = await db
    .select({ id: toolsTable.id })
    .from(toolsTable)
    .where(eq(toolsTable.slug, slug))

  return tool
}

export const getToolReviews = async (toolId: string) => {
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
}

export const getUserReview = async (toolId: string, userId: string) => {
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
}

export const upsertToolReview = async (
  toolId: string,
  userId: string,
  userName: string | null,
  rating: number,
  reviewText: string | null,
) => {
  const existing = await getUserReview(toolId, userId)

  if (existing) {
    await db
      .update(toolReviewsTable)
      .set({ rating, reviewText, updatedAt: new Date() })
      .where(eq(toolReviewsTable.id, existing.id))

    return { existing: true }
  }

  const id = createCustomId()
  await db
    .insert(toolReviewsTable)
    .values({ id, toolId, userId, userName, rating, reviewText })

  return { existing: false }
}

export const updateToolReview = async (
  reviewId: string,
  rating: number,
  reviewText: string | null,
) => {
  await db
    .update(toolReviewsTable)
    .set({ rating, reviewText, updatedAt: new Date() })
    .where(eq(toolReviewsTable.id, reviewId))
}

export const getToolReviewById = async (reviewId: string) => {
  const [review] = await db
    .select()
    .from(toolReviewsTable)
    .where(eq(toolReviewsTable.id, reviewId))

  return review ?? null
}

export const hasUserUsedTool = async (toolId: string, userId: string) => {
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
}

export const insertToolRun = async (data: {
  id: string
  toolId: string
  userId: string
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  status: "running" | "completed" | "failed"
  cost: string
  completedAt: Date
}) => {
  const [run] = await db.insert(toolRunsTable).values(data).returning()
  return run
}

export const updateToolRun = async (
  id: string,
  data: {
    outputs: Record<string, unknown>
    status: "running" | "completed" | "failed"
    completedAt: Date
  },
) => {
  const [run] = await db
    .update(toolRunsTable)
    .set(data)
    .where(eq(toolRunsTable.id, id))
    .returning()
  return run
}
