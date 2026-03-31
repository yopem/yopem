import { ORPCError } from "@orpc/server"
import { Result } from "better-result"
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
import {
  deductCreditsForRun,
  getUserCredits,
  initUserCredits,
} from "db/services/user"
import { executeAITool } from "llm/executor"
import {
  ContextLengthError,
  InvalidKeyError,
  RateLimitError,
} from "llm/providers"
import { checkAndTriggerAutoTopup } from "payments/auto-topup"
import type { ApiKeyConfig } from "shared/api-keys-schema"
import { decryptApiKey } from "shared/crypto"
import { createCustomId } from "shared/custom-id"

import {
  AiExecutionError,
  ApiKeyInactiveError,
  ApiKeyNotFoundError,
  AssetNotFoundError,
  AssetValidationError,
  CryptoOperationError,
  ForbiddenError,
  InsufficientCreditsError,
  ReviewNotFoundError,
  SettingsNotFoundError,
  ToolConfigurationError,
  ToolNotAvailableError,
  ToolNotFoundError,
} from "../procedure-errors"

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
      const toolResult = await Result.tryPromise({
        try: async () => {
          const tool = await getToolById(input.id)
          if (!tool) {
            throw new ToolNotFoundError({ toolId: input.id })
          }
          return tool
        },
        catch: (e) =>
          ToolNotFoundError.is(e)
            ? e
            : new ToolNotFoundError({ toolId: input.id }),
      })

      if (Result.isError(toolResult)) {
        throw new ORPCError("NOT_FOUND", { message: toolResult.error.message })
      }

      return projectPublicTool(toolResult.value)
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .handler(async ({ input }) => {
      const toolResult = await Result.tryPromise({
        try: async () => {
          const tool = await getToolBySlug(input.slug)
          if (!tool) {
            throw new ToolNotFoundError({ slug: input.slug })
          }
          return tool
        },
        catch: (e) =>
          ToolNotFoundError.is(e)
            ? e
            : new ToolNotFoundError({ slug: input.slug }),
      })

      if (Result.isError(toolResult)) {
        throw new ORPCError("NOT_FOUND", { message: toolResult.error.message })
      }

      return projectPublicTool(toolResult.value)
    }),

  adminGetById: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const toolResult = await Result.tryPromise({
        try: async () => {
          const tool = await getToolById(input.id)
          if (!tool) {
            throw new ToolNotFoundError({ toolId: input.id })
          }
          return tool
        },
        catch: (e) =>
          ToolNotFoundError.is(e)
            ? e
            : new ToolNotFoundError({ toolId: input.id }),
      })

      if (Result.isError(toolResult)) {
        throw new ORPCError("NOT_FOUND", { message: toolResult.error.message })
      }

      return toolResult.value
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
      const [tool, cachedApiKeysResult, userCredits] = await Promise.all([
        getToolById(input.toolId),
        context.redis.getCache<ApiKeyConfig[]>(cacheKey),
        getUserCredits(context.session.id),
      ])

      if (!tool) {
        throw new ToolNotFoundError({ toolId: input.toolId })
      }

      if (tool.status !== "active") {
        throw new ToolNotAvailableError({ toolId: input.toolId })
      }

      if (tool.apiKeyId === null) {
        throw new ToolConfigurationError({
          toolId: input.toolId,
          message: "Tool is not configured with an API key",
        })
      }

      const cachedApiKeys = cachedApiKeysResult.match({
        ok: (v) => v,
        err: () => null,
      })

      let apiKeys = cachedApiKeys
      if (!apiKeys) {
        const settings = await getSetting(API_KEYS_SETTING_KEY)

        if (!settings?.settingValue) {
          throw new SettingsNotFoundError({
            key: API_KEYS_SETTING_KEY,
            message: "No API keys configured",
          })
        }
        apiKeys = settings.settingValue as ApiKeyConfig[]
      }

      const selectedKey = apiKeys.find((key) => key.id === tool.apiKeyId)

      if (!selectedKey) {
        throw new ApiKeyNotFoundError({
          keyId: tool.apiKeyId,
          message: "The API key configured for this tool no longer exists",
        })
      }

      if (selectedKey.status !== "active") {
        throw new ApiKeyInactiveError({
          apiKeyId: tool.apiKeyId,
          message: "The API key configured for this tool is inactive",
        })
      }

      const credits = userCredits ?? (await initUserCredits(context.session.id))

      const cost = Number(tool.costPerRun ?? 0)
      if (Number(credits.balance) < cost) {
        throw new InsufficientCreditsError({
          required: cost,
          available: Number(credits.balance),
        })
      }

      const runId = createCustomId()
      const decryptResult = decryptApiKey(selectedKey.apiKey)

      if (Result.isError(decryptResult)) {
        throw new CryptoOperationError({
          operation: "decrypt",
          message: "Failed to decrypt API key",
        })
      }

      const decryptedKey = decryptResult.value
      const toolConfig = tool.config as { modelEngine: string } | null

      if (toolConfig === null) {
        throw new ToolConfigurationError({
          toolId: input.toolId,
          message: "Tool configuration is missing",
        })
      }

      const execResult = await executeAITool({
        systemRole: tool.systemRole ?? "",
        userInstructionTemplate: tool.userInstructionTemplate ?? "",
        inputs: input.inputs,
        config: toolConfig,
        outputFormat: tool.outputFormat ?? "plain",
        apiKey: decryptedKey,
        provider: selectedKey.provider,
      })

      if (Result.isError(execResult)) {
        const error = execResult.error
        const errorMessage = error.message
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
          ContextLengthError.is(error) ||
          InvalidKeyError.is(error) ||
          RateLimitError.is(error)
        ) {
          throw new AiExecutionError({
            message: `AI execution failed: ${errorMessage}`,
            cause: error,
          })
        }
        throw new AiExecutionError({
          message: `AI execution failed: ${errorMessage}`,
          cause: error,
        })
      }

      const output = execResult.value.output

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
      const cachedApiKeysResult =
        await context.redis.getCache<ApiKeyConfig[]>(cacheKey)

      const cachedApiKeys = cachedApiKeysResult.match({
        ok: (v) => v,
        err: () => null,
      })

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

      const decryptResult = decryptApiKey(selectedKey.apiKey)

      if (Result.isError(decryptResult)) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to decrypt API key",
        })
      }

      const decryptedKey = decryptResult.value

      const execResult = await executeAITool({
        systemRole: input.systemRole,
        userInstructionTemplate: input.userInstructionTemplate,
        inputs: input.inputs,
        config: input.config,
        outputFormat: input.outputFormat,
        apiKey: decryptedKey,
        provider: selectedKey.provider,
      })

      if (Result.isError(execResult)) {
        const error = execResult.error
        const errorMessage = error.message
        if (
          ContextLengthError.is(error) ||
          InvalidKeyError.is(error) ||
          RateLimitError.is(error)
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
        output: execResult.value.output,
        cost: 0,
      }
    }),

  create: adminProcedure
    .input(insertToolSchema)
    .handler(async ({ context, input }) => {
      const { tagIds, categoryIds, thumbnailId, ...toolData } = input

      if (thumbnailId) {
        const assetResult = await Result.tryPromise({
          try: async () => {
            const asset = await getAssetById(thumbnailId)
            if (!asset) {
              throw new AssetNotFoundError({ assetId: thumbnailId })
            }
            if (asset.type !== "images") {
              throw new AssetValidationError({
                message: "Thumbnail must be an image asset",
              })
            }
            return asset
          },
          catch: (e) => {
            if (AssetNotFoundError.is(e) || AssetValidationError.is(e)) {
              return e
            }
            return new AssetNotFoundError({ assetId: thumbnailId })
          },
        })

        if (Result.isError(assetResult)) {
          const error = assetResult.error
          if (AssetNotFoundError.is(error)) {
            throw new ORPCError("NOT_FOUND", { message: error.message })
          }
          throw new ORPCError("BAD_REQUEST", { message: error.message })
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
      const assetResult = await Result.tryPromise({
        try: async () => {
          const asset = await getAssetById(thumbnailId)
          if (!asset) {
            throw new AssetNotFoundError({ assetId: thumbnailId })
          }
          if (asset.type !== "images") {
            throw new AssetValidationError({
              message: "Thumbnail must be an image asset",
            })
          }
          return asset
        },
        catch: (e) => {
          if (AssetNotFoundError.is(e) || AssetValidationError.is(e)) {
            return e
          }
          return new AssetNotFoundError({ assetId: thumbnailId })
        },
      })

      if (Result.isError(assetResult)) {
        const error = assetResult.error
        if (AssetNotFoundError.is(error)) {
          throw new ORPCError("NOT_FOUND", { message: error.message })
        }
        throw new ORPCError("BAD_REQUEST", { message: error.message })
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
      const result = await Result.tryPromise({
        try: async () => {
          const tool = await duplicateTool(input.id, context.session.id)
          if (!tool) {
            throw new ToolNotFoundError({ toolId: input.id })
          }
          return tool
        },
        catch: (e) =>
          ToolNotFoundError.is(e)
            ? e
            : new ToolNotFoundError({ toolId: input.id }),
      })

      if (Result.isError(result)) {
        throw new ORPCError("NOT_FOUND", { message: result.error.message })
      }

      return result.value
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
      const toolResult = await Result.tryPromise({
        try: async () => {
          const tool = await getToolBySlugId(input.slug)
          if (!tool) {
            throw new ToolNotFoundError({ slug: input.slug })
          }
          return tool
        },
        catch: (e) =>
          ToolNotFoundError.is(e)
            ? e
            : new ToolNotFoundError({ slug: input.slug }),
      })

      if (Result.isError(toolResult)) {
        throw new ORPCError("NOT_FOUND", { message: toolResult.error.message })
      }

      const result = await getToolReviews(toolResult.value.id)
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
      const toolResult = await Result.tryPromise({
        try: async () => {
          const tool = await getToolBySlugId(input.slug)
          if (!tool) {
            throw new ToolNotFoundError({ slug: input.slug })
          }
          return tool
        },
        catch: (e) =>
          ToolNotFoundError.is(e)
            ? e
            : new ToolNotFoundError({ slug: input.slug }),
      })

      if (Result.isError(toolResult)) {
        throw new ORPCError("NOT_FOUND", { message: toolResult.error.message })
      }

      const hasUsed = await hasUserUsedTool(
        toolResult.value.id,
        context.session.id,
      )

      if (!hasUsed) {
        throw new ORPCError("BAD_REQUEST", {
          message: "You must use this tool at least once before reviewing it",
        })
      }

      return upsertToolReview(
        toolResult.value.id,
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
      const reviewResult = await Result.tryPromise({
        try: async () => {
          const review = await getToolReviewById(input.reviewId)
          if (!review) {
            throw new ReviewNotFoundError({ reviewId: input.reviewId })
          }
          if (review.userId !== context.session.id) {
            throw new ForbiddenError({
              message: "You can only update your own reviews",
            })
          }
          return review
        },
        catch: (e) => {
          if (ReviewNotFoundError.is(e) || ForbiddenError.is(e)) {
            return e
          }
          return new ReviewNotFoundError({ reviewId: input.reviewId })
        },
      })

      if (Result.isError(reviewResult)) {
        const error = reviewResult.error
        if (ReviewNotFoundError.is(error)) {
          throw new ORPCError("NOT_FOUND", { message: error.message })
        }
        if (ForbiddenError.is(error)) {
          throw new ORPCError("FORBIDDEN", { message: error.message })
        }
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
      const toolResult = await Result.tryPromise({
        try: async () => {
          const tool = await getToolBySlugId(input.slug)
          if (!tool) {
            throw new ToolNotFoundError({ slug: input.slug })
          }
          return tool
        },
        catch: (e) =>
          ToolNotFoundError.is(e)
            ? e
            : new ToolNotFoundError({ slug: input.slug }),
      })

      if (Result.isError(toolResult)) {
        throw new ORPCError("NOT_FOUND", { message: toolResult.error.message })
      }

      return getUserReview(toolResult.value.id, context.session.id)
    }),

  hasUsedTool: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const toolResult = await Result.tryPromise({
        try: async () => {
          const tool = await getToolBySlugId(input.slug)
          if (!tool) {
            throw new ToolNotFoundError({ slug: input.slug })
          }
          return tool
        },
        catch: (e) =>
          ToolNotFoundError.is(e)
            ? e
            : new ToolNotFoundError({ slug: input.slug }),
      })

      if (Result.isError(toolResult)) {
        throw new ORPCError("NOT_FOUND", { message: toolResult.error.message })
      }

      const hasUsed = await hasUserUsedTool(
        toolResult.value.id,
        context.session.id,
      )

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
      const cachedResult = await context.redis.getCache<
        {
          id: string
          slug: string
          name: string
          excerpt: string | null
          costPerRun: string | null
          thumbnail: { id: string; url: string } | null
        }[]
      >(cacheKey)

      const cached = cachedResult.match({
        ok: (v) => v,
        err: () => null,
      })

      if (cached) {
        return { results: cached }
      }

      const results = await searchTools(input.query, input.limit)

      void context.redis.setCache(cacheKey, results, 60)

      return { results }
    }),
}
