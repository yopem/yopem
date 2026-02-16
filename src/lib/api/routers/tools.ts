import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { executeAITool } from "@/lib/ai/executor"
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
} from "@/lib/api/orpc"
import {
  adminSettingsTable,
  assetsTable,
  categoriesTable,
  creditTransactionsTable,
  insertToolSchema,
  tagsTable,
  toolCategoriesTable,
  toolRunsTable,
  toolReviewsTable,
  toolsTable,
  toolTagsTable,
  updateToolSchema,
  userCreditsTable,
} from "@/lib/db/schema"
import { apiKeyEncryptionSecret } from "@/lib/env/server"
import type { ApiKeyConfig } from "@/lib/schemas/api-keys"
import { decryptApiKey } from "@/lib/utils/crypto"
import { createCustomId } from "@/lib/utils/custom-id"
import { generateUniqueToolSlug } from "@/lib/utils/slug"

export const toolsRouter = {
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
          search: z.string().optional(),
          categoryIds: z.array(z.string()).optional(),
          status: z.enum(["draft", "active", "archived", "all"]).optional(),
          priceFilter: z.enum(["all", "free", "paid"]).optional(),
          tagIds: z.array(z.string()).optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const limit = input?.limit ?? 20
      const conditions = []

      if (input?.status && input.status !== "all") {
        conditions.push(eq(toolsTable.status, input.status))
      } else if (!input?.status) {
        conditions.push(eq(toolsTable.status, "active"))
      }

      if (input?.categoryIds && input.categoryIds.length > 0) {
        const toolsWithAllCategories = await context.db
          .select({
            toolId: toolCategoriesTable.toolId,
          })
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
        const toolsWithAllTags = await context.db
          .select({
            toolId: toolTagsTable.toolId,
          })
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

      const tools = await context.db
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
        .where(and(...conditions))
        .orderBy(desc(toolsTable.createdAt))
        .limit(limit + 1)

      const toolIds = tools.map((t) => t.id)

      const categoriesMap = new Map<
        string,
        { id: string; name: string; slug: string }[]
      >()
      if (toolIds.length > 0) {
        const toolCategories = await context.db
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
          categoriesMap.get(row.toolId)!.push({
            id: row.id,
            name: row.name,
            slug: row.slug,
          })
        }
      }

      const ratingsMap = new Map<
        string,
        { averageRating: number | null; reviewCount: number }
      >()
      if (toolIds.length > 0) {
        const ratings = await context.db
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
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select()
        .from(toolsTable)
        .where(eq(toolsTable.id, input.id))

      if (!tool) {
        throw new Error("Tool not found")
      }

      const [categoriesResult, tagsResult, thumbnailResult] = await Promise.all(
        [
          context.db
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
            .where(eq(toolCategoriesTable.toolId, input.id)),
          context.db
            .select({
              id: tagsTable.id,
              name: tagsTable.name,
              slug: tagsTable.slug,
            })
            .from(toolTagsTable)
            .innerJoin(tagsTable, eq(toolTagsTable.tagId, tagsTable.id))
            .where(eq(toolTagsTable.toolId, input.id)),
          tool.thumbnailId
            ? context.db
                .select({
                  id: assetsTable.id,
                  url: assetsTable.url,
                  originalName: assetsTable.originalName,
                })
                .from(assetsTable)
                .where(eq(assetsTable.id, tool.thumbnailId))
            : Promise.resolve([]),
        ],
      )

      return {
        ...tool,
        categories: categoriesResult,
        tags: tagsResult,
        thumbnail: thumbnailResult[0] ?? null,
      }
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const tool = await context.db.query.toolsTable.findFirst({
        where: eq(toolsTable.slug, input.slug),
      })

      if (!tool) {
        throw new Error("Tool not found")
      }

      const [categoriesResult, tagsResult, thumbnailResult, ratingResult] =
        await Promise.all([
          context.db
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
          context.db
            .select({
              id: tagsTable.id,
              name: tagsTable.name,
              slug: tagsTable.slug,
            })
            .from(toolTagsTable)
            .innerJoin(tagsTable, eq(toolTagsTable.tagId, tagsTable.id))
            .where(eq(toolTagsTable.toolId, tool.id)),
          tool.thumbnailId
            ? context.db
                .select({
                  id: assetsTable.id,
                  url: assetsTable.url,
                  originalName: assetsTable.originalName,
                })
                .from(assetsTable)
                .where(eq(assetsTable.id, tool.thumbnailId))
            : Promise.resolve([]),
          context.db
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
    }),

  getPopular: publicProcedure.handler(async ({ context }) => {
    const tools = await context.db
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
      .limit(10)

    return tools.map((tool) => {
      const thumbnail =
        tool.thumbnailAssetId && tool.thumbnailUrl
          ? { id: tool.thumbnailAssetId, url: tool.thumbnailUrl }
          : null

      const { thumbnailUrl: _, thumbnailAssetId: __, ...toolData } = tool

      return {
        ...toolData,
        thumbnail,
      }
    })
  }),

  getCategories: publicProcedure.handler(async ({ context }) => {
    return await context.db
      .select()
      .from(categoriesTable)
      .orderBy(categoriesTable.sortOrder)
  }),

  getTags: publicProcedure.handler(async ({ context }) => {
    return await context.db.select().from(tagsTable).orderBy(tagsTable.name)
  }),

  execute: protectedProcedure
    .input(
      z.object({
        toolId: z.string(),
        inputs: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ context, input }) => {
      const cacheKey = `settings:${apiKeyEncryptionSecret}`
      const [toolResult, cachedApiKeys, userCreditsResult] = await Promise.all([
        context.db
          .select()
          .from(toolsTable)
          .where(eq(toolsTable.id, input.toolId)),
        context.redis.getCache<ApiKeyConfig[]>(cacheKey),
        context.db
          .select()
          .from(userCreditsTable)
          .where(eq(userCreditsTable.userId, context.session.id)),
      ])

      const [tool] = toolResult
      if (tool === undefined) {
        throw new Error("Tool not found")
      }

      if (tool.status !== "active") {
        throw new Error("Tool is not available")
      }

      if (tool.apiKeyId === null) {
        throw new Error(
          "Tool is not configured with an API key. Please update the tool configuration.",
        )
      }

      let apiKeys = cachedApiKeys
      if (!apiKeys) {
        const [adminSettings] = await context.db
          .select()
          .from(adminSettingsTable)
          .where(eq(adminSettingsTable.settingKey, apiKeyEncryptionSecret))

        if (!adminSettings?.settingValue) {
          throw new Error(
            "No API keys configured. Please add an API key in settings.",
          )
        }
        apiKeys = adminSettings.settingValue as ApiKeyConfig[]
      }

      const selectedKey = apiKeys.find((key) => key.id === tool.apiKeyId)

      if (!selectedKey) {
        throw new Error(
          "The API key configured for this tool no longer exists. Please update the tool configuration.",
        )
      }

      if (selectedKey.status !== "active") {
        throw new Error(
          "The API key configured for this tool is inactive. Please activate it in settings or select a different key.",
        )
      }

      let [userCredits] = userCreditsResult

      if (!userCredits) {
        const newCredits = {
          id: createCustomId(),
          userId: context.session.id,
          balance: "100",
          totalPurchased: "0",
          totalUsed: "0",
        }
        await context.db.insert(userCreditsTable).values(newCredits)
        userCredits = newCredits as typeof userCredits
      }

      const cost = Number(tool.costPerRun ?? 0)
      if (Number(userCredits.balance) < cost) {
        throw new Error("Insufficient credits")
      }

      const runId = createCustomId()

      const decryptedKey = decryptApiKey(selectedKey.apiKey)

      const toolConfig = tool.config as {
        modelEngine: string
        temperature: number
        maxTokens: number
      } | null

      if (toolConfig === null) {
        throw new Error("Tool configuration is missing")
      }

      let output: string
      try {
        const result = await executeAITool({
          systemRole: tool.systemRole ?? "",
          userInstructionTemplate: tool.userInstructionTemplate ?? "",
          inputs: input.inputs,
          config: toolConfig,
          outputFormat: tool.outputFormat ?? "plain",
          apiKey: decryptedKey,
          provider: selectedKey.provider,
        })
        output = result.output
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        await context.db.insert(toolRunsTable).values({
          id: runId,
          toolId: input.toolId,
          userId: context.session.id,
          inputs: input.inputs,
          outputs: { error: errorMessage },
          status: "failed" as const,
          cost: String(cost),
          completedAt: new Date(),
        })
        throw new Error(`AI execution failed: ${errorMessage}`)
      }

      const newRun = {
        id: runId,
        toolId: input.toolId,
        userId: context.session.id,
        inputs: input.inputs,
        outputs: { result: output },
        status: "completed" as const,
        cost: String(cost),
        completedAt: new Date(),
      }
      await context.db.insert(toolRunsTable).values(newRun)

      await context.db
        .update(userCreditsTable)
        .set({
          balance: sql`${userCreditsTable.balance} - ${cost}`,
          totalUsed: sql`${userCreditsTable.totalUsed} + ${cost}`,
          updatedAt: new Date(),
        })
        .where(eq(userCreditsTable.userId, context.session.id))

      const newTransaction = {
        id: createCustomId(),
        userId: context.session.id,
        amount: String(-cost),
        type: "usage" as const,
        description: `Tool execution: ${tool.name}`,
        toolRunId: runId,
      }
      await context.db.insert(creditTransactionsTable).values(newTransaction)

      return {
        runId,
        output,
        cost,
      }
    }),

  executePreview: adminProcedure
    .input(
      z.object({
        systemRole: z.string(),
        userInstructionTemplate: z.string(),
        inputVariable: z.array(
          z.object({
            variableName: z.string(),
            type: z.enum([
              "text",
              "long_text",
              "number",
              "boolean",
              "select",
              "image",
              "video",
            ]),
            description: z.string(),
            options: z
              .array(
                z.object({
                  label: z.string(),
                  value: z.string(),
                }),
              )
              .optional(),
            isOptional: z.boolean().optional(),
          }),
        ),
        inputs: z.record(z.string(), z.string()),
        config: z.object({
          modelEngine: z.string(),
          temperature: z.number(),
          maxTokens: z.number(),
        }),
        outputFormat: z.enum(["plain", "json", "image", "video"]),
        apiKeyId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const requiredInputs = input.inputVariable.filter((v) => !v.isOptional)
      const missingInputs = requiredInputs
        .filter((v) => !input.inputs[v.variableName])
        .map((v) => v.variableName)

      if (missingInputs.length > 0) {
        throw new Error(`Missing required inputs: ${missingInputs.join(", ")}`)
      }

      if (!input.systemRole || input.systemRole.trim() === "") {
        throw new Error("System role is required")
      }
      if (
        !input.userInstructionTemplate ||
        input.userInstructionTemplate.trim() === ""
      ) {
        throw new Error("User instruction template is required")
      }

      if (!input.apiKeyId) {
        throw new Error("API key is required for preview execution")
      }

      const cacheKey = `settings:${apiKeyEncryptionSecret}`
      const cachedApiKeys =
        await context.redis.getCache<ApiKeyConfig[]>(cacheKey)

      let apiKeys = cachedApiKeys
      if (!apiKeys) {
        const [adminSettings] = await context.db
          .select()
          .from(adminSettingsTable)
          .where(eq(adminSettingsTable.settingKey, apiKeyEncryptionSecret))

        if (!adminSettings?.settingValue) {
          throw new Error(
            "No API keys configured. Please add an API key in settings.",
          )
        }
        apiKeys = adminSettings.settingValue as ApiKeyConfig[]
      }

      const selectedKey = apiKeys.find((key) => key.id === input.apiKeyId)

      if (!selectedKey) {
        throw new Error("Selected API key not found")
      }

      if (selectedKey.status !== "active") {
        throw new Error("Selected API key is inactive")
      }

      const decryptedKey = decryptApiKey(selectedKey.apiKey)

      if (!decryptedKey.startsWith("sk-")) {
        throw new Error("Invalid OpenAI API key format")
      }

      try {
        const result = await executeAITool({
          systemRole: input.systemRole,
          userInstructionTemplate: input.userInstructionTemplate,
          inputs: input.inputs,
          config: input.config,
          outputFormat: input.outputFormat,
          apiKey: decryptedKey,
          provider: selectedKey.provider,
        })

        return {
          output: result.output,
          cost: 0,
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error("AI execution failed with an unknown error")
      }
    }),

  create: adminProcedure
    .input(insertToolSchema)
    .handler(async ({ context, input }) => {
      const { tagIds, categoryIds, thumbnailId, ...toolData } = input

      if (thumbnailId) {
        const [asset] = await context.db
          .select()
          .from(assetsTable)
          .where(eq(assetsTable.id, thumbnailId))

        if (!asset) {
          throw new Error("Thumbnail asset not found")
        }

        if (asset.type !== "images") {
          throw new Error("Thumbnail must be an image asset")
        }
      }

      if (categoryIds && categoryIds.length > 0) {
        const existingCategories = await context.db
          .select()
          .from(categoriesTable)
          .where(inArray(categoriesTable.id, categoryIds))

        if (existingCategories.length !== categoryIds.length) {
          throw new Error("One or more category IDs are invalid")
        }
      }

      if (tagIds && tagIds.length > 0) {
        const existingTags = await context.db
          .select()
          .from(tagsTable)
          .where(inArray(tagsTable.id, tagIds))

        if (existingTags.length !== tagIds.length) {
          throw new Error("One or more tag IDs are invalid")
        }
      }

      const id = createCustomId()
      const slug = await generateUniqueToolSlug(toolData.name)
      await context.db.insert(toolsTable).values({
        ...toolData,
        id,
        slug,
        createdBy: context.session.id,
      })

      if (categoryIds && categoryIds.length > 0) {
        await context.db.insert(toolCategoriesTable).values(
          categoryIds.map((categoryId) => ({
            toolId: id,
            categoryId,
          })),
        )
      }

      if (tagIds && tagIds.length > 0) {
        await context.db.insert(toolTagsTable).values(
          tagIds.map((tagId) => ({
            toolId: id,
            tagId,
          })),
        )
      }

      return { id }
    }),

  update: adminProcedure
    .input(updateToolSchema)
    .handler(async ({ context, input }) => {
      if (!input.id) {
        throw new Error("Tool ID is required")
      }
      const { id, tagIds, categoryIds, thumbnailId, ...data } = input

      if (thumbnailId) {
        const [asset] = await context.db
          .select()
          .from(assetsTable)
          .where(eq(assetsTable.id, thumbnailId))

        if (!asset) {
          throw new Error("Thumbnail asset not found")
        }

        if (asset.type !== "images") {
          throw new Error("Thumbnail must be an image asset")
        }
      }

      if (categoryIds && categoryIds.length > 0) {
        const existingCategories = await context.db
          .select()
          .from(categoriesTable)
          .where(inArray(categoriesTable.id, categoryIds))

        if (existingCategories.length !== categoryIds.length) {
          throw new Error("One or more category IDs are invalid")
        }
      }

      if (tagIds && tagIds.length > 0) {
        const existingTags = await context.db
          .select()
          .from(tagsTable)
          .where(inArray(tagsTable.id, tagIds))

        if (existingTags.length !== tagIds.length) {
          throw new Error("One or more tag IDs are invalid")
        }
      }

      let slug: string | undefined
      if (data.name) {
        const [existingTool] = await context.db
          .select()
          .from(toolsTable)
          .where(eq(toolsTable.id, id))

        if (existingTool.name !== data.name) {
          slug = await generateUniqueToolSlug(data.name)
        }
      }

      await context.db
        .update(toolsTable)
        .set({
          ...data,
          ...(slug ? { slug } : {}),
          thumbnailId: thumbnailId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(toolsTable.id, id))

      if (categoryIds !== undefined) {
        await context.db
          .delete(toolCategoriesTable)
          .where(eq(toolCategoriesTable.toolId, id))

        if (categoryIds.length > 0) {
          await context.db.insert(toolCategoriesTable).values(
            categoryIds.map((categoryId) => ({
              toolId: id,
              categoryId,
            })),
          )
        }
      }

      if (tagIds !== undefined) {
        await context.db
          .delete(toolTagsTable)
          .where(eq(toolTagsTable.toolId, id))

        if (tagIds.length > 0) {
          await context.db.insert(toolTagsTable).values(
            tagIds.map((tagId) => ({
              toolId: id,
              tagId,
            })),
          )
        }
      }

      return { success: true }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      await context.db.delete(toolsTable).where(eq(toolsTable.id, input.id))
      return { success: true }
    }),

  duplicate: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select()
        .from(toolsTable)
        .where(eq(toolsTable.id, input.id))

      if (!tool) {
        throw new Error("Tool not found")
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

      await context.db.insert(toolsTable).values({
        ...toolData,
        id: newId,
        name: duplicateName,
        slug,
        createdBy: context.session.id,
        status: "draft",
      })

      return { id: newId }
    }),

  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1),
        status: z.enum(["draft", "active", "archived"]),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.db
        .update(toolsTable)
        .set({ status: input.status, updatedAt: new Date() })
        .where(inArray(toolsTable.id, input.ids))

      return { success: true, count: input.ids.length }
    }),

  getReviews: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select({ id: toolsTable.id })
        .from(toolsTable)
        .where(eq(toolsTable.slug, input.slug))

      if (!tool) {
        throw new Error("Tool not found")
      }

      const reviews = await context.db
        .select({
          id: toolReviewsTable.id,
          rating: toolReviewsTable.rating,
          reviewText: toolReviewsTable.reviewText,
          createdAt: toolReviewsTable.createdAt,
          userId: toolReviewsTable.userId,
          userName: toolReviewsTable.userName,
        })
        .from(toolReviewsTable)
        .where(eq(toolReviewsTable.toolId, tool.id))
        .orderBy(desc(toolReviewsTable.createdAt))

      const avgRatingResult = await context.db
        .select({
          avgRating: sql`AVG(${toolReviewsTable.rating})`,
          count: sql`COUNT(*)`,
        })
        .from(toolReviewsTable)
        .where(eq(toolReviewsTable.toolId, tool.id))

      const avgRating = avgRatingResult[0]?.avgRating
        ? Number(avgRatingResult[0].avgRating)
        : null
      const reviewCount = Number(avgRatingResult[0]?.count ?? 0)

      return {
        reviews,
        averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount,
      }
    }),

  submitReview: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().max(2000).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select({ id: toolsTable.id })
        .from(toolsTable)
        .where(eq(toolsTable.slug, input.slug))

      if (!tool) {
        throw new Error("Tool not found")
      }

      const [hasUsed] = await context.db
        .select({ count: sql`COUNT(*)` })
        .from(toolRunsTable)
        .where(
          and(
            eq(toolRunsTable.toolId, tool.id),
            eq(toolRunsTable.userId, context.session.id),
            eq(toolRunsTable.status, "completed"),
          ),
        )

      if (Number(hasUsed?.count) === 0) {
        throw new Error(
          "You must use this tool at least once before reviewing it",
        )
      }

      const existingReview = await context.db
        .select()
        .from(toolReviewsTable)
        .where(
          and(
            eq(toolReviewsTable.toolId, tool.id),
            eq(toolReviewsTable.userId, context.session.id),
          ),
        )

      if (existingReview.length > 0) {
        await context.db
          .update(toolReviewsTable)
          .set({
            rating: input.rating,
            reviewText: input.reviewText ?? null,
            updatedAt: new Date(),
          })
          .where(eq(toolReviewsTable.id, existingReview[0].id))

        return { success: true, existing: true }
      }

      const id = createCustomId()
      await context.db.insert(toolReviewsTable).values({
        id,
        toolId: tool.id,
        userId: context.session.id,
        userName:
          context.session.username ??
          context.session.name ??
          context.session.email ??
          null,
        rating: input.rating,
        reviewText: input.reviewText ?? null,
      })

      return { success: true, existing: false }
    }),

  updateReview: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().max(2000).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [review] = await context.db
        .select()
        .from(toolReviewsTable)
        .where(eq(toolReviewsTable.id, input.reviewId))

      if (!review) {
        throw new Error("Review not found")
      }

      if (review.userId !== context.session.id) {
        throw new Error("You can only update your own reviews")
      }

      await context.db
        .update(toolReviewsTable)
        .set({
          rating: input.rating,
          reviewText: input.reviewText ?? null,
          updatedAt: new Date(),
        })
        .where(eq(toolReviewsTable.id, input.reviewId))

      return { success: true }
    }),

  getUserReview: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select({ id: toolsTable.id })
        .from(toolsTable)
        .where(eq(toolsTable.slug, input.slug))

      if (!tool) {
        throw new Error("Tool not found")
      }

      const [review] = await context.db
        .select()
        .from(toolReviewsTable)
        .where(
          and(
            eq(toolReviewsTable.toolId, tool.id),
            eq(toolReviewsTable.userId, context.session.id),
          ),
        )

      return review ?? null
    }),

  hasUsedTool: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select({ id: toolsTable.id })
        .from(toolsTable)
        .where(eq(toolsTable.slug, input.slug))

      if (!tool) {
        throw new Error("Tool not found")
      }

      const [result] = await context.db
        .select({ count: sql`COUNT(*)` })
        .from(toolRunsTable)
        .where(
          and(
            eq(toolRunsTable.toolId, tool.id),
            eq(toolRunsTable.userId, context.session.id),
            eq(toolRunsTable.status, "completed"),
          ),
        )

      return { hasUsed: Number(result?.count) > 0 }
    }),
}
