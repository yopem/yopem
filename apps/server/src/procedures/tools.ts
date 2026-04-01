import { Result } from "better-result"
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
} from "server/orpc"
import { z } from "zod"

import type { SelectAsset, SelectTool } from "db/schema"
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
import { formatError, logger } from "logger"
import { checkAndTriggerAutoTopup } from "payments/auto-topup"
import type { ApiKeyConfig } from "shared/api-keys-schema"
import { decryptApiKey } from "shared/crypto"
import { createCustomId } from "shared/custom-id"

import { handleProcedureError } from "./error-handler"
import {
  AiExecutionError,
  ApiKeyInactiveError,
  ApiKeyNotFoundError,
  AssetNotFoundError,
  AssetValidationError,
  CategoryValidationError,
  CryptoOperationError,
  ForbiddenError,
  InsufficientCreditsError,
  ReviewNotFoundError,
  SettingsNotFoundError,
  TagValidationError,
  ToolConfigurationError,
  ToolNotAvailableError,
  ToolNotFoundError,
  ValidationError,
} from "./procedure-errors"

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

async function getToolWithError(
  toolId: string,
): Promise<Result<SelectTool, ToolNotFoundError>> {
  const result = await getToolById(toolId)
  return result.mapError(() => new ToolNotFoundError({ toolId }))
}

async function getToolBySlugWithError(
  slug: string,
): Promise<Result<SelectTool, ToolNotFoundError>> {
  const result = await getToolBySlug(slug)
  return result.mapError(() => new ToolNotFoundError({ slug }))
}

async function getToolBySlugIdWithError(
  slug: string,
): Promise<Result<{ id: string }, ToolNotFoundError>> {
  const result = await getToolBySlugId(slug)
  return result.mapError(() => new ToolNotFoundError({ slug }))
}

async function getReviewWithError(
  reviewId: string,
): Promise<
  Result<
    NonNullable<Awaited<ReturnType<typeof getToolReviewById>>>,
    ReviewNotFoundError
  >
> {
  const review = await getToolReviewById(reviewId)
  if (!review) {
    return Result.err(new ReviewNotFoundError({ reviewId }))
  }
  return Result.ok(review)
}

async function getAssetWithValidation(
  assetId: string,
): Promise<Result<SelectAsset, AssetNotFoundError | AssetValidationError>> {
  const result = await getAssetById(assetId)
  const mappedResult = result.mapError(
    () => new AssetNotFoundError({ assetId }),
  )
  if (mappedResult.isErr()) {
    return mappedResult
  }
  const asset = mappedResult.value
  if (asset.type !== "images") {
    return Result.err(
      new AssetValidationError({
        message: "Thumbnail must be an image asset",
      }),
    )
  }
  return Result.ok(asset)
}

async function getApiKeysWithError(redis: {
  getCache: <T>(key: string) => Promise<Result<T | null, unknown>>
}): Promise<Result<ApiKeyConfig[], SettingsNotFoundError>> {
  const cacheKey = `settings:${API_KEYS_SETTING_KEY}`
  const cachedResult = await redis.getCache<ApiKeyConfig[]>(cacheKey)

  const cached = cachedResult.match({
    ok: (v) => v,
    err: () => null,
  })

  if (cached) {
    return Result.ok(cached)
  }

  const settings = await getSetting(API_KEYS_SETTING_KEY)

  if (!settings?.settingValue) {
    return Result.err(
      new SettingsNotFoundError({
        key: API_KEYS_SETTING_KEY,
        message: "No API keys configured",
      }),
    )
  }

  return Result.ok(settings.settingValue as ApiKeyConfig[])
}

function validateRequiredInputs(
  inputs: Record<string, string>,
  inputVariables: { variableName: string; isOptional?: boolean }[],
): Result<void, ValidationError> {
  const requiredInputs = inputVariables.filter((v) => !v.isOptional)
  const missingInputs = requiredInputs
    .filter((v) => !inputs[v.variableName])
    .map((v) => v.variableName)

  if (missingInputs.length > 0) {
    return Result.err(
      new ValidationError({
        message: `Missing required inputs: ${missingInputs.join(", ")}`,
      }),
    )
  }

  return Result.ok(undefined)
}

function validateSystemRole(systemRole: string): Result<void, ValidationError> {
  if (!systemRole || systemRole.trim() === "") {
    return Result.err(
      new ValidationError({
        field: "systemRole",
        message: "System role is required",
      }),
    )
  }
  return Result.ok(undefined)
}

function validateUserInstructionTemplate(
  template: string,
): Result<void, ValidationError> {
  if (!template || template.trim() === "") {
    return Result.err(
      new ValidationError({
        field: "userInstructionTemplate",
        message: "User instruction template is required",
      }),
    )
  }
  return Result.ok(undefined)
}

function validateApiKeyId(apiKeyId: string): Result<void, ValidationError> {
  if (!apiKeyId) {
    return Result.err(
      new ValidationError({
        field: "apiKeyId",
        message: "API key is required for preview execution",
      }),
    )
  }
  return Result.ok(undefined)
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
      const result = await Result.tryPromise({
        try: () => listTools(input ?? undefined),
        catch: (e) => new ToolConfigurationError({ message: String(e) }),
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const result = await getToolWithError(input.id)

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return projectPublicTool(result.value)
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .handler(async ({ input }) => {
      const result = await getToolBySlugWithError(input.slug)

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return projectPublicTool(result.value)
    }),

  adminGetById: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const result = await getToolWithError(input.id)

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  getPopular: publicProcedure.handler(async () => {
    const result = await Result.tryPromise({
      try: () => getPopularTools(10),
      catch: (e) => new ToolConfigurationError({ message: String(e) }),
    })

    if (result.isErr()) {
      return handleProcedureError(result)
    }

    return result.value
  }),

  getCategories: publicProcedure.handler(async () => {
    const result = await Result.tryPromise({
      try: () => listCategories(),
      catch: (e) => new CategoryValidationError({ message: String(e) }),
    })

    if (result.isErr()) {
      return handleProcedureError(result)
    }

    return result.value
  }),

  getTags: publicProcedure.handler(async () => {
    const result = await Result.tryPromise({
      try: () => listTags(),
      catch: (e) => new TagValidationError({ message: String(e) }),
    })

    if (result.isErr()) {
      return handleProcedureError(result)
    }

    return result.value
  }),

  execute: protectedProcedure
    .input(
      z.object({
        toolId: z.string(),
        inputs: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ context, input }) => {
      const result = await Result.gen(async function* () {
        const tool = yield* await getToolWithError(input.toolId)

        if (tool.status !== "active") {
          return Result.err(new ToolNotAvailableError({ toolId: input.toolId }))
        }

        if (tool.apiKeyId === null) {
          return Result.err(
            new ToolConfigurationError({
              toolId: input.toolId,
              message: "Tool is not configured with an API key",
            }),
          )
        }

        const apiKeys = yield* await getApiKeysWithError(context.redis)

        const selectedKey = apiKeys.find((key) => key.id === tool.apiKeyId)

        if (!selectedKey) {
          return Result.err(
            new ApiKeyNotFoundError({
              keyId: tool.apiKeyId,
              message: "The API key configured for this tool no longer exists",
            }),
          )
        }

        if (selectedKey.status !== "active") {
          return Result.err(
            new ApiKeyInactiveError({
              apiKeyId: tool.apiKeyId,
              message: "The API key configured for this tool is inactive",
            }),
          )
        }

        const userCredits = await getUserCredits(context.session.id)
        const credits =
          userCredits ?? (await initUserCredits(context.session.id))

        const cost = Number(tool.costPerRun ?? 0)
        if (Number(credits.balance) < cost) {
          return Result.err(
            new InsufficientCreditsError({
              required: cost,
              available: Number(credits.balance),
            }),
          )
        }

        const decryptedKey = yield* decryptApiKey(selectedKey.apiKey).mapError(
          () =>
            new CryptoOperationError({
              operation: "decrypt",
              message: "Failed to decrypt API key",
            }),
        )

        const toolConfig = tool.config as { modelEngine: string } | null

        if (toolConfig === null) {
          return Result.err(
            new ToolConfigurationError({
              toolId: input.toolId,
              message: "Tool configuration is missing",
            }),
          )
        }

        const runId = createCustomId()

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
          return Result.err(
            new AiExecutionError({
              message: `AI execution failed: ${errorMessage}`,
              cause: error,
            }),
          )
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

        void Result.tryPromise({
          try: () =>
            checkAndTriggerAutoTopup(
              context.session.id,
              context.session.email,
              context.session.username ?? context.session.name,
            ),
          catch: (error) => {
            logger.warn(
              `Auto-topup check failed for user ${context.session.id}: ${formatError(error)}`,
            )
            return undefined
          },
        })

        return Result.ok({
          runId,
          output,
          cost,
        })
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
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
      const result = await Result.gen(async function* () {
        yield* validateRequiredInputs(input.inputs, input.inputVariable)
        yield* validateSystemRole(input.systemRole)
        yield* validateUserInstructionTemplate(input.userInstructionTemplate)
        yield* validateApiKeyId(input.apiKeyId)

        const apiKeys = yield* await getApiKeysWithError(context.redis)

        const selectedKey = apiKeys.find((key) => key.id === input.apiKeyId)

        if (!selectedKey) {
          return Result.err(
            new ValidationError({
              field: "apiKeyId",
              message: "Selected API key not found",
            }),
          )
        }

        if (selectedKey.status !== "active") {
          return Result.err(
            new ValidationError({
              field: "apiKeyId",
              message: "Selected API key is inactive",
            }),
          )
        }

        const decryptedKey = yield* decryptApiKey(selectedKey.apiKey).mapError(
          () =>
            new CryptoOperationError({
              operation: "decrypt",
              message: "Failed to decrypt API key",
            }),
        )

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
            return Result.err(
              new ValidationError({
                message: `AI execution failed: ${errorMessage}`,
              }),
            )
          }
          return Result.err(
            new AiExecutionError({
              message: `AI execution failed: ${errorMessage}`,
              cause: error,
            }),
          )
        }

        return Result.ok({
          output: execResult.value.output,
          cost: 0,
        })
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  create: adminProcedure
    .input(insertToolSchema)
    .handler(async ({ context, input }) => {
      const result = await Result.gen(async function* () {
        const { tagIds, categoryIds, thumbnailId, ...toolData } = input

        if (thumbnailId) {
          yield* await getAssetWithValidation(thumbnailId)
        }

        if (categoryIds && categoryIds.length > 0) {
          const valid = await validateCategoryIds(categoryIds)
          if (!valid) {
            return Result.err(
              new ValidationError({
                message: "One or more category IDs are invalid",
              }),
            )
          }
        }

        if (tagIds && tagIds.length > 0) {
          const valid = await validateTagIds(tagIds)
          if (!valid) {
            return Result.err(
              new ValidationError({
                message: "One or more tag IDs are invalid",
              }),
            )
          }
        }

        const tool = await createTool({
          ...toolData,
          thumbnailId: thumbnailId ?? undefined,
          categoryIds,
          tagIds,
          createdBy: context.session.id,
        })

        return Result.ok(tool)
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  update: adminProcedure.input(updateToolSchema).handler(async ({ input }) => {
    const result = await Result.gen(async function* () {
      if (!input.id) {
        return Result.err(
          new ValidationError({
            field: "id",
            message: "Tool ID is required",
          }),
        )
      }
      const { id, tagIds, categoryIds, thumbnailId, ...data } = input

      if (thumbnailId) {
        yield* await getAssetWithValidation(thumbnailId)
      }

      if (categoryIds && categoryIds.length > 0) {
        const valid = await validateCategoryIds(categoryIds)
        if (!valid) {
          return Result.err(
            new ValidationError({
              message: "One or more category IDs are invalid",
            }),
          )
        }
      }

      if (tagIds && tagIds.length > 0) {
        const valid = await validateTagIds(tagIds)
        if (!valid) {
          return Result.err(
            new ValidationError({
              message: "One or more tag IDs are invalid",
            }),
          )
        }
      }

      const tool = await updateTool(id, {
        ...data,
        thumbnailId: thumbnailId ?? undefined,
        categoryIds,
        tagIds,
      })

      return Result.ok(tool)
    })

    if (result.isErr()) {
      return handleProcedureError(result)
    }

    return result.value
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
      const result = await Result.gen(async function* () {
        const tool = yield* await duplicateTool(input.id, context.session.id)
        return Result.ok(tool)
      })

      if (result.isErr()) {
        return handleProcedureError(result)
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
      const result = await Result.gen(async function* () {
        const tool = yield* await getToolBySlugIdWithError(input.slug)
        const reviews = await getToolReviews(tool.id)
        return Result.ok({
          ...reviews,
          reviews: reviews.reviews.map(
            ({ userId: _userId, ...publicReview }) => publicReview,
          ),
        })
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
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
      const result = await Result.gen(async function* () {
        const tool = yield* await getToolBySlugIdWithError(input.slug)

        const hasUsed = await hasUserUsedTool(tool.id, context.session.id)

        if (!hasUsed) {
          return Result.err(
            new ValidationError({
              message:
                "You must use this tool at least once before reviewing it",
            }),
          )
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

        return Result.ok(review)
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
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
      const result = await Result.gen(async function* () {
        const review = yield* await getReviewWithError(input.reviewId)

        if (review.userId !== context.session.id) {
          return Result.err(
            new ForbiddenError({
              message: "You can only update your own reviews",
            }),
          )
        }

        await updateToolReview(
          input.reviewId,
          input.rating,
          input.reviewText ?? null,
        )

        return Result.ok({ success: true })
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  getUserReview: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const result = await Result.gen(async function* () {
        const tool = yield* await getToolBySlugIdWithError(input.slug)
        const review = await getUserReview(tool.id, context.session.id)
        return Result.ok(review)
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  hasUsedTool: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const result = await Result.gen(async function* () {
        const tool = yield* await getToolBySlugIdWithError(input.slug)
        const hasUsed = await hasUserUsedTool(tool.id, context.session.id)
        return Result.ok({ hasUsed })
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
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
