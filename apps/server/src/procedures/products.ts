import { ORPCError } from "@orpc/server"
import { executeAIProduct } from "server/llm/executor"
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
} from "server/orpc"
import {
  formatQuotaError,
  requireSubscriptionForProduct,
  trackProductExecution,
} from "server/payments/product-subscription-middleware"
import { z } from "zod"

import { getSettingCache } from "cache/services/settings"
import { getOrCompute } from "cache/services/with-cache"
import { insertProductSchema, updateProductSchema } from "db/schema"
import { getSetting } from "db/services/admin"
import { getAssetById } from "db/services/assets"
import { listCategories, validateCategoryIds } from "db/services/categories"
import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  getPopularProducts,
  getProductById,
  getProductBySlug,
  getProductBySlugId,
  getProductReviewById,
  getProductReviews,
  getUserReview,
  hasUserUsedProduct,
  insertProductRun,
  listProducts,
  searchProducts,
  updateProduct,
  updateProductReview,
  updateProductStatus,
  upsertProductReview,
} from "db/services/products"
import { listTags, validateTagIds } from "db/services/tags"
import type { ApiKeyConfig } from "utils/api-keys-schema"
import { decryptApiKey } from "utils/crypto"
import { createCustomId } from "utils/custom-id"

const API_KEYS_SETTING_KEY = "api_keys"
const SETTINGS_CACHE_TTL = 300

const publicProductFields = [
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

type PublicProductField = (typeof publicProductFields)[number]

function projectPublicProduct<T extends Record<string, unknown>>(
  product: T,
): Pick<T, Extract<keyof T, PublicProductField>> {
  const result = {} as Pick<T, Extract<keyof T, PublicProductField>>
  for (const key of publicProductFields) {
    if (key in product) {
      ;(result as Record<string, unknown>)[key] = product[key]
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

export const productsRouter = {
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
      return await listProducts(input ?? undefined)
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const product = await getProductById(input.id)
      if (!product) {
        throw new ORPCError("NOT_FOUND", {
          message: `Product not found: ${input.id}`,
        })
      }
      return projectPublicProduct(product)
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .handler(async ({ input }) => {
      const product = await getProductBySlug(input.slug)
      if (!product) {
        throw new ORPCError("NOT_FOUND", {
          message: `Product not found: ${input.slug}`,
        })
      }
      return projectPublicProduct(product)
    }),

  adminGetById: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const product = await getProductById(input.id)
      if (!product) {
        throw new ORPCError("NOT_FOUND", {
          message: `Product not found: ${input.id}`,
        })
      }
      return product
    }),

  getPopular: publicProcedure.handler(async () => {
    return await getPopularProducts(10)
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
        productId: z.string(),
        inputs: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ context, input }) => {
      const product = await getProductById(input.productId)
      if (!product) {
        throw new ORPCError("NOT_FOUND", {
          message: `Product not found: ${input.productId}`,
        })
      }

      if (product.status !== "active") {
        throw new ORPCError("BAD_REQUEST", {
          message: `Product not available: ${input.productId}`,
        })
      }

      if (product.apiKeyId === null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Product is not configured with an API key",
        })
      }

      const apiKeys = await getSettingCache<ApiKeyConfig[]>(
        context.redis,
        API_KEYS_SETTING_KEY,
        async () => {
          const settings = await getSetting(API_KEYS_SETTING_KEY)
          if (!settings?.settingValue) {
            throw new ORPCError("NOT_FOUND", {
              message: "No API keys configured",
            })
          }
          return settings.settingValue as ApiKeyConfig[]
        },
        SETTINGS_CACHE_TTL,
      )

      const selectedKey = apiKeys.find((key) => key.id === product.apiKeyId)

      if (!selectedKey) {
        throw new ORPCError("NOT_FOUND", {
          message: "The API key configured for this product no longer exists",
        })
      }

      if (selectedKey.status !== "active") {
        throw new ORPCError("BAD_REQUEST", {
          message: "The API key configured for this product is inactive",
        })
      }

      const cost = Number(product.costPerRun ?? 0)
      const estimatedTokens = 1000

      const subCheck = await requireSubscriptionForProduct(
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

      const productConfig = product.config as { modelEngine: string } | null

      if (productConfig === null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Product configuration is missing",
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
        execResult = await executeAIProduct({
          systemRole: product.systemRole ?? "",
          userInstructionTemplate: product.userInstructionTemplate ?? "",
          inputs: input.inputs,
          config: productConfig,
          outputFormat: product.outputFormat ?? "plain",
          apiKey: decryptedKey,
          provider: selectedKey.provider,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        await insertProductRun({
          id: runId,
          productId: input.productId,
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

      await insertProductRun({
        id: runId,
        productId: input.productId,
        userId: context.session.id,
        inputs: input.inputs,
        outputs: { result: output },
        status: "completed",
        cost: String(cost),
        completedAt: new Date(),
      })

      void trackProductExecution(context.session.id, estimatedTokens).catch(
        (error) => {
          console.warn(
            `Failed to track product usage for user ${context.session.id}:`,
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

      const apiKeys = await getSettingCache<ApiKeyConfig[]>(
        context.redis,
        API_KEYS_SETTING_KEY,
        async () => {
          const settings = await getSetting(API_KEYS_SETTING_KEY)
          if (!settings?.settingValue) {
            throw new ORPCError("NOT_FOUND", {
              message: "No API keys configured",
            })
          }
          return settings.settingValue as ApiKeyConfig[]
        },
        SETTINGS_CACHE_TTL,
      )

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
        execResult = await executeAIProduct({
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
    .input(insertProductSchema)
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

      const product = await createProduct({
        ...toolData,
        thumbnailId: thumbnailId ?? undefined,
        categoryIds,
        tagIds,
        createdBy: context.session.id,
      })

      return product
    }),

  update: adminProcedure
    .input(updateProductSchema)
    .handler(async ({ input }) => {
      if (!input.id) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Product ID is required",
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

      const product = await updateProduct(id, {
        ...data,
        thumbnailId: thumbnailId ?? undefined,
        categoryIds,
        tagIds,
      })

      return product
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await deleteProduct(input.id)
      return { success: true }
    }),

  duplicate: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const product = await duplicateProduct(input.id, context.session.id)
      return product
    }),

  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1),
        status: z.enum(["draft", "active", "archived"]),
      }),
    )
    .handler(async ({ input }) => {
      return await updateProductStatus(input.ids, input.status)
    }),

  getReviews: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input }) => {
      const product = await getProductBySlugId(input.slug)
      if (!product) {
        throw new ORPCError("NOT_FOUND", {
          message: `Product not found: ${input.slug}`,
        })
      }
      const reviews = await getProductReviews(product.id)
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
      const product = await getProductBySlugId(input.slug)
      if (!product) {
        throw new ORPCError("NOT_FOUND", {
          message: `Product not found: ${input.slug}`,
        })
      }

      const hasUsed = await hasUserUsedProduct(product.id, context.session.id)

      if (!hasUsed) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "You must use this product at least once before reviewing it",
        })
      }

      const review = await upsertProductReview(
        product.id,
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
      const review = await getProductReviewById(input.reviewId)
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

      await updateProductReview(
        input.reviewId,
        input.rating,
        input.reviewText ?? null,
      )

      return { success: true }
    }),

  getUserReview: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const product = await getProductBySlugId(input.slug)
      if (!product) {
        throw new ORPCError("NOT_FOUND", {
          message: `Product not found: ${input.slug}`,
        })
      }
      const review = await getUserReview(product.id, context.session.id)
      return review
    }),

  hasUsedProduct: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      const product = await getProductBySlugId(input.slug)
      if (!product) {
        throw new ORPCError("NOT_FOUND", {
          message: `Product not found: ${input.slug}`,
        })
      }
      const hasUsed = await hasUserUsedProduct(product.id, context.session.id)
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
      const results = await getOrCompute(
        context.redis,
        cacheKey,
        async () => await searchProducts(input.query, input.limit),
        60,
      )

      return { results }
    }),
}
