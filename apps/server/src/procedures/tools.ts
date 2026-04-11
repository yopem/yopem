import { ORPCError } from "@orpc/server"
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
} from "server/orpc"
import { z } from "zod"

import { insertToolSchema, updateToolSchema } from "db/schema"
import { getSetting } from "db/services/admin"
import { getAssetById } from "db/services/assets"
import { listCategories, validateCategoryIds } from "db/services/categories"
import { listTags, validateTagIds } from "db/services/tags"
import {
  createTool,
  deleteTool,
  duplicateTool,
  getPopularTools,
  getToolById,
  getToolBySlug,
  getToolBySlugId,
  getToolReviewById,
  getToolReviews,
  getUserReview,
  hasUserUsedTool,
  insertToolRun,
  listTools,
  searchTools,
  updateTool,
  updateToolReview,
  updateToolStatus,
  upsertToolReview,
} from "db/services/tools"
import type { ApiKeyConfig } from "shared/api-keys-schema"
import { decryptApiKey } from "shared/crypto"
import { createCustomId } from "shared/custom-id"

import { executeAITool } from "../llm/executor"
import {
  formatQuotaError,
  requireSubscriptionForTool,
  trackToolExecution,
} from "../payments/tool-subscription-middleware"

const API_KEYS_SETTING_KEY = "api_keys"

const publicToolFields = [
  "id",
  "slug",
  "name",
  "description",
  "excerpt",
  "isPublic",
  "costPerRun",
  "markup",
  "status",
  "reviewStatus",
  "categories",
  "tags",
  "thumbnail",
  "averageRating",
  "reviewCount",
  "outputFormat",
  "inputVariable",
  "createdAt",
  "updatedAt",
] as const

type PublicToolField = (typeof publicToolFields)[number]

function projectPublicTool<T extends Record<string, unknown>>(
  tool: T,
): Pick<T, Extract<keyof T, PublicToolField>> {
  const result = {} as Pick<T, Extract<keyof T, PublicToolField>>
  for (const key of publicToolFields) {
    if (key in tool) {
      ;(result as Record<string, unknown>)[key] = tool[key]
    }
  }
  return result
}

function validateRequiredInputs(
  inputs: Record<string, string>,
  inputVariables: { variableName: string; isOptional?: boolean }[],
): void {
  const requiredInputs = inputVariables.filter((v) => !v.isOptional)
  const missingInputs = requiredInputs
    .filter((v) => !inputs[v.variableName])
    .map((v) => v.variableName)

  if (missingInputs.length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Missing required inputs: ${missingInputs.join(", ")}`,
    })
  }
}

function validateSystemRole(systemRole: string): void {
  if (!systemRole || systemRole.trim() === "") {
    throw new ORPCError("BAD_REQUEST", {
      message: "System role is required",
    })
  }
}

function validateUserInstructionTemplate(template: string): void {
  if (!template || template.trim() === "") {
    throw new ORPCError("BAD_REQUEST", {
      message: "User instruction template is required",
    })
  }
}

function validateApiKeyId(apiKeyId: string): void {
  if (!apiKeyId) {
    throw new ORPCError("BAD_REQUEST", {
      message: "API key is required for preview execution",
    })
  }
}

export const toolsRouter = {
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(1000).default(20),
          cursor: z.string().optional(),
          search: z.string().optional(),
          categoryIds: z.array(z.string()).optional(),
          status: z.enum(["draft", "active", "archived", "all"]).optional(),
          priceFilter: z.enum(["all", "free", "paid"]).optional(),
          tagIds: z.array(z.string()).optional(),
        })
        .optional(),
    )
    .handler(async ({ input }) => {
      return await listTools(input ?? undefined)
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const tool = await getToolById(input.id)
      if (!tool) {
        throw new ORPCError("NOT_FOUND", {
          message: `Tool not found: ${input.id}`,
        })
      }
      return projectPublicTool(tool)
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .handler(async ({ input }) => {
      const tool = await getToolBySlug(input.slug)
      if (!tool) {
        throw new ORPCError("NOT_FOUND", {
          message: `Tool not found: ${input.slug}`,
        })
      }
      return projectPublicTool(tool)
    }),

  adminGetById: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const tool = await getToolById(input.id)
      if (!tool) {
        throw new ORPCError("NOT_FOUND", {
          message: `Tool not found: ${input.id}`,
        })
      }
      return tool
    }),

  getPopular: publicProcedure.handler(async () => {
    return await getPopularTools(10)
  }),

  getCategories: publicProcedure.handler(async () => {
    return await listCategories()
  }),

  getTags: publicProcedure.handler(async () => {
    return await listTags()
  }),

  execute: protectedProcedure
    .input(
      z.object({
        toolId: z.string(),
        inputs: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ context, input }) => {
      const tool = await getToolById(input.toolId)
      if (!tool) {
        throw new ORPCError("NOT_FOUND", {
          message: `Tool not found: ${input.toolId}`,
        })
      }

      if (tool.status !== "active") {
        throw new ORPCError("BAD_REQUEST", {
          message: `Tool not available: ${input.toolId}`,
        })
      }

      if (tool.apiKeyId === null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Tool is not configured with an API key",
        })
      }

      const cacheKey = `settings:${API_KEYS_SETTING_KEY}`
      const cached = await context.redis.getCache<ApiKeyConfig[]>(cacheKey)
      let apiKeys: ApiKeyConfig[]
      if (cached) {
        apiKeys = cached
      } else {
        const settings = await getSetting(API_KEYS_SETTING_KEY)
        if (!settings?.settingValue) {
          throw new ORPCError("NOT_FOUND", {
            message: "No API keys configured",
          })
        }
        apiKeys = settings.settingValue as ApiKeyConfig[]
      }

      const selectedKey = apiKeys.find((key) => key.id === tool.apiKeyId)

      if (!selectedKey) {
        throw new ORPCError("NOT_FOUND", {
          message: "The API key configured for this tool no longer exists",
        })
      }

      if (selectedKey.status !== "active") {
        throw new ORPCError("BAD_REQUEST", {
          message: "The API key configured for this tool is inactive",
        })
      }

      const cost = Number(tool.costPerRun ?? 0)
      const estimatedTokens = 1000

      const subCheck = await requireSubscriptionForTool(
        context.session.id,
        estimatedTokens,
      )

      if (!subCheck.allowed) {
        throw new ORPCError("BAD_REQUEST", {
          message: formatQuotaError(subCheck.reason ?? "quota_exceeded"),
        })
      }

      const decryptedKey = decryptApiKey(selectedKey.apiKey)
      if (!decryptedKey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to decrypt API key",
        })
      }

      const toolConfig = tool.config as { modelEngine: string } | null

      if (toolConfig === null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Tool configuration is missing",
        })
      }

      const runId = createCustomId()

      let execResult: {
        output: string
        usage?: {
          promptTokens: number
          completionTokens: number
          totalTokens: number
        }
      }
      try {
        execResult = await executeAITool({
          systemRole: tool.systemRole ?? "",
          userInstructionTemplate: tool.userInstructionTemplate ?? "",
          inputs: input.inputs,
          config: toolConfig,
          outputFormat: tool.outputFormat ?? "plain",
          apiKey: decryptedKey,
          provider: selectedKey.provider,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        await insertToolRun({
          id: runId,
          toolId: input.toolId,
          userId: context.session.id,
          inputs: input.inputs,
          outputs: { error: errorMessage },
          status: "failed",
          cost: String(cost),
          completedAt: new Date(),
        })
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `AI execution failed: ${errorMessage}`,
          cause: error,
        })
      }

      const output = execResult.output

      await insertToolRun({
        id: runId,
        toolId: input.toolId,
        userId: context.session.id,
        inputs: input.inputs,
        outputs: { result: output },
        status: "completed",
        cost: String(cost),
        completedAt: new Date(),
      })

      void trackToolExecution(context.session.id, estimatedTokens).catch(
        (error) => {
          console.warn(
            `Failed to track tool usage for user ${context.session.id}:`,
            error,
          )
        },
      )

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
        }),
        outputFormat: z.enum(["plain", "json", "image", "video"]),
        apiKeyId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      validateRequiredInputs(input.inputs, input.inputVariable)
      validateSystemRole(input.systemRole)
      validateUserInstructionTemplate(input.userInstructionTemplate)
      validateApiKeyId(input.apiKeyId)

      const cacheKey = `settings:${API_KEYS_SETTING_KEY}`
      const cached = await context.redis.getCache<ApiKeyConfig[]>(cacheKey)
      let apiKeys: ApiKeyConfig[]
      if (cached) {
        apiKeys = cached
      } else {
        const settings = await getSetting(API_KEYS_SETTING_KEY)
        if (!settings?.settingValue) {
          throw new ORPCError("NOT_FOUND", {
            message: "No API keys configured",
          })
        }
        apiKeys = settings.settingValue as ApiKeyConfig[]
      }

      const selectedKey = apiKeys.find((key) => key.id === input.apiKeyId)

      if (!selectedKey) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Selected API key not found",
        })
      }

      if (selectedKey.status !== "active") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Selected API key is inactive",
        })
      }

      const decryptedKey = decryptApiKey(selectedKey.apiKey)
      if (!decryptedKey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to decrypt API key",
        })
      }

      let execResult: {
        output: string
        usage?: {
          promptTokens: number
          completionTokens: number
          totalTokens: number
        }
      }
      try {
        execResult = await executeAITool({
          systemRole: input.systemRole,
          userInstructionTemplate: input.userInstructionTemplate,
          inputs: input.inputs,
          config: input.config,
          outputFormat: input.outputFormat,
          apiKey: decryptedKey,
          provider: selectedKey.provider,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        if (
          error instanceof Error &&
          (error.name === "ContextLengthError" ||
            error.name === "InvalidKeyError" ||
            error.name === "RateLimitError")
        ) {
          throw new ORPCError("BAD_REQUEST", {
            message: `AI execution failed: ${errorMessage}`,
          })
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `AI execution failed: ${errorMessage}`,
          cause: error,
        })
      }

      return {
        output: execResult.output,
        cost: 0,
      }
    }),

  create: adminProcedure
    .input(insertToolSchema)
    .handler(async ({ context, input }) => {
      const { tagIds, categoryIds, thumbnailId, ...toolData } = input

      if (thumbnailId) {
        const asset = await getAssetById(thumbnailId)
        if (!asset) {
          throw new ORPCError("NOT_FOUND", {
            message: `Asset not found: ${thumbnailId}`,
          })
        }
        if (asset.type !== "images") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Thumbnail must be an image asset",
          })
        }
      }

      if (categoryIds && categoryIds.length > 0) {
        const valid = await validateCategoryIds(categoryIds)
        if (!valid) {
          throw new ORPCError("BAD_REQUEST", {
            message: "One or more category IDs are invalid",
          })
        }
      }

      if (tagIds && tagIds.length > 0) {
        const valid = await validateTagIds(tagIds)
        if (!valid) {
          throw new ORPCError("BAD_REQUEST", {
            message: "One or more tag IDs are invalid",
          })
        }
      }

      const tool = await createTool({
        ...toolData,
        thumbnailId: thumbnailId ?? undefined,
        categoryIds,
        tagIds,
        createdBy: context.session.id,
      })

      return tool
    }),

  update: adminProcedure.input(updateToolSchema).handler(async ({ input }) => {
    if (!input.id) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Tool ID is required",
      })
    }
    const { id, tagIds, categoryIds, thumbnailId, ...data } = input

    if (thumbnailId) {
      const asset = await getAssetById(thumbnailId)
      if (!asset) {
        throw new ORPCError("NOT_FOUND", {
          message: `Asset not found: ${thumbnailId}`,
        })
      }
      if (asset.type !== "images") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Thumbnail must be an image asset",
        })
      }
    }

    if (categoryIds && categoryIds.length > 0) {
      const valid = await validateCategoryIds(categoryIds)
      if (!valid) {
        throw new ORPCError("BAD_REQUEST", {
          message: "One or more category IDs are invalid",
        })
      }
    }

    if (tagIds && tagIds.length > 0) {
      const valid = await validateTagIds(tagIds)
      if (!valid) {
        throw new ORPCError("BAD_REQUEST", {
          message: "One or more tag IDs are invalid",
        })
      }
    }

    const tool = await updateTool(id, {
      ...data,
      thumbnailId: thumbnailId ?? undefined,
      categoryIds,
      tagIds,
    })

    return tool
  }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await deleteTool(input.id)
      return { success: true }
    }),

  duplicate: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const tool = await duplicateTool(input.id, context.session.id)
      return tool
    }),

  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1),
        status: z.enum(["draft", "active", "archived"]),
      }),
    )
    .handler(async ({ input }) => {
      return await updateToolStatus(input.ids, input.status)
    }),

  getReviews: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input }) => {
      const tool = await getToolBySlugId(input.slug)
      if (!tool) {
        throw new ORPCError("NOT_FOUND", {
          message: `Tool not found: ${input.slug}`,
        })
      }
      const reviews = await getToolReviews(tool.id)
      return {
        ...reviews,
        reviews: reviews.reviews.map(
          ({ userId: _userId, ...publicReview }) => publicReview,
        ),
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
      const tool = await getToolBySlugId(input.slug)
      if (!tool) {
        throw new ORPCError("NOT_FOUND", {
          message: `Tool not found: ${input.slug}`,
        })
      }

      const hasUsed = await hasUserUsedTool(tool.id, context.session.id)

      if (!hasUsed) {
        throw new ORPCError("BAD_REQUEST", {
          message: "You must use this tool at least once before reviewing it",
        })
      }

      const review = await upsertToolReview(
        tool.id,
        context.session.id,
        context.session.username ??
          context.session.name ??
          context.session.email ??
          null,
        input.rating,
        input.reviewText ?? null,
      )

      return review
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
      const review = await getToolReviewById(input.reviewId)
      if (!review) {
        throw new ORPCError("NOT_FOUND", {
          message: `Review not found: ${input.reviewId}`,
        })
      }

      if (review.userId !== context.session.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "You can only update your own reviews",
        })
      }

      await updateToolReview(
        input.reviewId,
        input.rating,
        input.reviewText ?? null,
      )

      return { success: true }
    }),

  getUserReview: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const tool = await getToolBySlugId(input.slug)
      if (!tool) {
        throw new ORPCError("NOT_FOUND", {
          message: `Tool not found: ${input.slug}`,
        })
      }
      const review = await getUserReview(tool.id, context.session.id)
      return review
    }),

  hasUsedTool: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const tool = await getToolBySlugId(input.slug)
      if (!tool) {
        throw new ORPCError("NOT_FOUND", {
          message: `Tool not found: ${input.slug}`,
        })
      }
      const hasUsed = await hasUserUsedTool(tool.id, context.session.id)
      return { hasUsed }
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        limit: z.number().min(1).max(20).default(8),
      }),
    )
    .handler(async ({ context, input }) => {
      const cacheKey = `search:${input.query.toLowerCase().trim()}:${input.limit}`
      const cached = await context.redis.getCache<
        {
          id: string
          slug: string
          name: string
          excerpt: string | null
          costPerRun: string | null
          thumbnail: { id: string; url: string } | null
        }[]
      >(cacheKey)

      if (cached) {
        return { results: cached }
      }

      const results = await searchTools(input.query, input.limit)

      void context.redis.setCache(cacheKey, results, 60)

      return { results }
    }),
}
