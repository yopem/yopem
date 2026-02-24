import type { ApiKeyConfig } from "@repo/shared/api-keys-schema"

import { ORPCError } from "@orpc/server"
import { executeAITool } from "@repo/ai/executor"
import {
  ContextLengthError,
  InvalidKeyError,
  RateLimitError,
} from "@repo/ai/providers"
import { insertToolSchema, updateToolSchema } from "@repo/db/schema"
import { getSetting } from "@repo/db/services/admin"
import { getAssetById } from "@repo/db/services/assets"
import {
  listCategories,
  validateCategoryIds,
} from "@repo/db/services/categories"
import { listTags, validateTagIds } from "@repo/db/services/tags"
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
  updateTool,
  updateToolReview,
  updateToolStatus,
  upsertToolReview,
} from "@repo/db/services/tools"
import {
  deductCreditsForRun,
  getUserCredits,
  initUserCredits,
} from "@repo/db/services/user"
import { checkAndTriggerAutoTopup } from "@repo/payments/auto-topup"
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
} from "@repo/server/orpc"
import { decryptApiKey } from "@repo/shared/crypto"
import { createCustomId } from "@repo/shared/custom-id"
import { z } from "zod"

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
    .handler(({ input }) => {
      return listTools(input ?? undefined)
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const tool = await getToolById(input.id)

      if (!tool) {
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      return projectPublicTool(tool)
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .handler(async ({ input }) => {
      const tool = await getToolBySlug(input.slug)

      if (!tool) {
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      return projectPublicTool(tool)
    }),

  adminGetById: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const tool = await getToolById(input.id)

      if (!tool) {
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      return tool
    }),

  getPopular: publicProcedure.handler(() => {
    return getPopularTools(10)
  }),

  getCategories: publicProcedure.handler(() => {
    return listCategories()
  }),

  getTags: publicProcedure.handler(() => {
    return listTags()
  }),

  execute: protectedProcedure
    .input(
      z.object({
        toolId: z.string(),
        inputs: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ context, input }) => {
      const cacheKey = `settings:${API_KEYS_SETTING_KEY}`
      const [tool, cachedApiKeys, userCredits] = await Promise.all([
        getToolById(input.toolId),
        context.redis.getCache<ApiKeyConfig[]>(cacheKey),
        getUserCredits(context.session.id),
      ])

      if (!tool) {
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      if (tool.status !== "active") {
        throw new ORPCError("BAD_REQUEST", { message: "Tool is not available" })
      }

      if (tool.apiKeyId === null) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Tool is not configured with an API key. Please update the tool configuration.",
        })
      }

      let apiKeys = cachedApiKeys
      if (!apiKeys) {
        const settings = await getSetting(API_KEYS_SETTING_KEY)

        if (!settings?.settingValue) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message:
              "No API keys configured. Please add an API key in settings.",
          })
        }
        apiKeys = settings.settingValue as ApiKeyConfig[]
      }

      const selectedKey = apiKeys.find((key) => key.id === tool.apiKeyId)

      if (!selectedKey) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "The API key configured for this tool no longer exists. Please update the tool configuration.",
        })
      }

      if (selectedKey.status !== "active") {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "The API key configured for this tool is inactive. Please activate it in settings or select a different key.",
        })
      }

      const credits = userCredits ?? (await initUserCredits(context.session.id))

      const cost = Number(tool.costPerRun ?? 0)
      if (Number(credits.balance) < cost) {
        throw new ORPCError("BAD_REQUEST", { message: "Insufficient credits" })
      }

      const runId = createCustomId()
      const decryptedKey = decryptApiKey(selectedKey.apiKey)

      const toolConfig = tool.config as { modelEngine: string } | null

      if (toolConfig === null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Tool configuration is missing",
        })
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
        if (
          error instanceof ContextLengthError ||
          error instanceof InvalidKeyError ||
          error instanceof RateLimitError
        ) {
          throw new ORPCError("BAD_REQUEST", {
            message: `AI execution failed: ${errorMessage}`,
          })
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `AI execution failed: ${errorMessage}`,
        })
      }

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

      await deductCreditsForRun(context.session.id, cost, runId, tool.name)

      checkAndTriggerAutoTopup(
        context.session.id,
        context.session.email,
        context.session.username ?? context.session.name,
      ).catch(() => {
        return
      })

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
      const requiredInputs = input.inputVariable.filter((v) => !v.isOptional)
      const missingInputs = requiredInputs
        .filter((v) => !input.inputs[v.variableName])
        .map((v) => v.variableName)

      if (missingInputs.length > 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Missing required inputs: ${missingInputs.join(", ")}`,
        })
      }

      if (!input.systemRole || input.systemRole.trim() === "") {
        throw new ORPCError("BAD_REQUEST", {
          message: "System role is required",
        })
      }
      if (
        !input.userInstructionTemplate ||
        input.userInstructionTemplate.trim() === ""
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: "User instruction template is required",
        })
      }

      if (!input.apiKeyId) {
        throw new ORPCError("BAD_REQUEST", {
          message: "API key is required for preview execution",
        })
      }

      const cacheKey = `settings:${API_KEYS_SETTING_KEY}`
      const cachedApiKeys =
        await context.redis.getCache<ApiKeyConfig[]>(cacheKey)

      let apiKeys = cachedApiKeys
      if (!apiKeys) {
        const settings = await getSetting(API_KEYS_SETTING_KEY)

        if (!settings?.settingValue) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message:
              "No API keys configured. Please add an API key in settings.",
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
        if (error instanceof ORPCError) {
          throw error
        }
        const errorMessage =
          error instanceof Error
            ? error.message
            : "AI execution failed with an unknown error"
        if (
          error instanceof ContextLengthError ||
          error instanceof InvalidKeyError ||
          error instanceof RateLimitError
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
    }),

  create: adminProcedure
    .input(insertToolSchema)
    .handler(async ({ context, input }) => {
      const { tagIds, categoryIds, thumbnailId, ...toolData } = input

      if (thumbnailId) {
        const asset = await getAssetById(thumbnailId)

        if (!asset) {
          throw new ORPCError("NOT_FOUND", {
            message: "Thumbnail asset not found",
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

      return createTool({
        ...toolData,
        thumbnailId: thumbnailId ?? undefined,
        categoryIds,
        tagIds,
        createdBy: context.session.id,
      })
    }),

  update: adminProcedure.input(updateToolSchema).handler(async ({ input }) => {
    if (!input.id) {
      throw new ORPCError("BAD_REQUEST", { message: "Tool ID is required" })
    }
    const { id, tagIds, categoryIds, thumbnailId, ...data } = input

    if (thumbnailId) {
      const asset = await getAssetById(thumbnailId)

      if (!asset) {
        throw new ORPCError("NOT_FOUND", {
          message: "Thumbnail asset not found",
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

    return updateTool(id, {
      ...data,
      thumbnailId: thumbnailId ?? undefined,
      categoryIds,
      tagIds,
    })
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
      const result = await duplicateTool(input.id, context.session.id)

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      return result
    }),

  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1),
        status: z.enum(["draft", "active", "archived"]),
      }),
    )
    .handler(({ input }) => {
      return updateToolStatus(input.ids, input.status)
    }),

  getReviews: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input }) => {
      const tool = await getToolBySlugId(input.slug)

      if (!tool) {
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      const result = await getToolReviews(tool.id)
      return {
        ...result,
        reviews: result.reviews.map(
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
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      const hasUsed = await hasUserUsedTool(tool.id, context.session.id)

      if (!hasUsed) {
        throw new ORPCError("BAD_REQUEST", {
          message: "You must use this tool at least once before reviewing it",
        })
      }

      return upsertToolReview(
        tool.id,
        context.session.id,
        context.session.username ??
          context.session.name ??
          context.session.email ??
          null,
        input.rating,
        input.reviewText ?? null,
      )
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
        throw new ORPCError("NOT_FOUND", { message: "Review not found" })
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
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      return getUserReview(tool.id, context.session.id)
    }),

  hasUsedTool: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const tool = await getToolBySlugId(input.slug)

      if (!tool) {
        throw new ORPCError("NOT_FOUND", { message: "Tool not found" })
      }

      const hasUsed = await hasUserUsedTool(tool.id, context.session.id)

      return { hasUsed }
    }),
}
