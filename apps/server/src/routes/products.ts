import type { AppContext } from "server/context"
import type { ApiKeyConfig } from "server/llm/api-keys-schema"

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { ApiError } from "server/errors"
import { executeAIProduct } from "server/llm/executor"
import { requireAdmin, requireAuth } from "server/middleware"
import { assertSession } from "server/middleware"
import { decryptApiKey } from "server/utils/crypto"
import { z } from "zod"

import { redisCache } from "cache"
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
  getPublicProductById,
  getPublicProductBySlug,
  insertProductRun,
  listProducts,
  searchProducts,
  updateProduct,
  updateProductStatus,
} from "db/services/products"
import { listTags, validateTagIds } from "db/services/tags"
import { createCustomId } from "utils/custom-id"

import { idParamSchema, jsonOkResponse, paginationQuerySchema } from "./common"

const API_KEYS_SETTING_KEY = "api_keys"
const SETTINGS_CACHE_TTL = 300
function validateRequiredInputs(
  inputs: Record<string, string>,
  inputVariables: { variableName: string; isOptional?: boolean }[],
): void {
  const requiredInputs = inputVariables.filter((v) => !v.isOptional)
  const missingInputs = requiredInputs
    .filter((v) => !inputs[v.variableName])
    .map((v) => v.variableName)

  if (missingInputs.length > 0) {
    throw new ApiError("BAD_REQUEST", {
      message: `Missing required inputs: ${missingInputs.join(", ")}`,
    })
  }
}

function validateSystemRole(systemRole: string): void {
  if (!systemRole || systemRole.trim() === "") {
    throw new ApiError("BAD_REQUEST", {
      message: "System role is required",
    })
  }
}

function validateUserInstructionTemplate(template: string): void {
  if (!template || template.trim() === "") {
    throw new ApiError("BAD_REQUEST", {
      message: "User instruction template is required",
    })
  }
}

function validateApiKeyId(apiKeyId: string): void {
  if (!apiKeyId) {
    throw new ApiError("BAD_REQUEST", {
      message: "API key is required for preview execution",
    })
  }
}

const getApiKeys = () =>
  getOrCompute<ApiKeyConfig[]>(
    redisCache,
    API_KEYS_SETTING_KEY,
    async () => {
      const settings = await getSetting(API_KEYS_SETTING_KEY)
      if (!settings?.settingValue) {
        throw new ApiError("NOT_FOUND", {
          message: "No API keys configured",
        })
      }
      return settings.settingValue as ApiKeyConfig[]
    },
    SETTINGS_CACHE_TTL,
  )

const parseCommaSeparatedIds = (value?: string): string[] | undefined => {
  if (!value) return undefined
  const ids = value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
  return ids.length > 0 ? ids : undefined
}

export const productsPublicApp = new OpenAPIHono<AppContext>()

const listQuerySchema = paginationQuerySchema.extend({
  cursor: z.string().optional(),
  search: z.string().optional(),
  categoryIds: z.string().optional(),
  status: z.enum(["draft", "active", "archived", "all"]).optional(),
  priceFilter: z.enum(["all", "free", "paid"]).optional(),
  tagIds: z.string().optional(),
})

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["products"],
  request: {
    query: listQuerySchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsPublicApp.openapi(listRoute, async (c) => {
  const { limit, cursor, search, categoryIds, status, priceFilter, tagIds } =
    c.req.valid("query")

  const result = await listProducts({
    limit,
    cursor,
    search,
    categoryIds: parseCommaSeparatedIds(categoryIds),
    status,
    priceFilter,
    tagIds: parseCommaSeparatedIds(tagIds),
  })

  return c.json(result, 200)
})

const getByIdRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["products"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsPublicApp.openapi(getByIdRoute, async (c) => {
  const { id } = c.req.valid("param")
  const product = await getPublicProductById(id)

  if (!product) {
    throw new ApiError("NOT_FOUND", {
      message: `Product not found: ${id}`,
    })
  }

  return c.json(product, 200)
})

const getBySlugRoute = createRoute({
  method: "get",
  path: "/slug/:slug",
  tags: ["products"],
  request: {
    params: z.object({ slug: z.string().min(1) }),
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsPublicApp.openapi(getBySlugRoute, async (c) => {
  const { slug } = c.req.valid("param")
  const product = await getPublicProductBySlug(slug)

  if (!product) {
    throw new ApiError("NOT_FOUND", {
      message: `Product not found: ${slug}`,
    })
  }

  return c.json(product, 200)
})

const popularRoute = createRoute({
  method: "get",
  path: "/popular",
  tags: ["products"],
  responses: {
    200: jsonOkResponse(),
  },
})

productsPublicApp.openapi(popularRoute, async (c) => {
  return c.json(await getPopularProducts(10), 200)
})

const productCategoriesRoute = createRoute({
  method: "get",
  path: "/categories",
  tags: ["products"],
  responses: {
    200: jsonOkResponse(),
  },
})

productsPublicApp.openapi(productCategoriesRoute, async (c) => {
  return c.json(await listCategories(), 200)
})

const productTagsRoute = createRoute({
  method: "get",
  path: "/tags",
  tags: ["products"],
  responses: {
    200: jsonOkResponse(),
  },
})

productsPublicApp.openapi(productTagsRoute, async (c) => {
  return c.json(await listTags(), 200)
})

const searchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.coerce.number().min(1).max(20).default(8).optional(),
})

const searchRoute = createRoute({
  method: "get",
  path: "/search",
  tags: ["products"],
  request: {
    query: searchQuerySchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsPublicApp.openapi(searchRoute, async (c) => {
  const { query, limit } = c.req.valid("query")
  const cacheKey = `search:${query.toLowerCase().trim()}:${limit ?? 8}`

  const results = await getOrCompute(
    redisCache,
    cacheKey,
    async () => await searchProducts(query, limit ?? 8),
    60,
  )

  return c.json({ results }, 200)
})

export const productsProtectedApp = new OpenAPIHono<AppContext>()

productsProtectedApp.use("*", requireAuth)

const executeInputSchema = z.object({
  inputs: z.record(z.string(), z.unknown()),
})

const executeRoute = createRoute({
  method: "post",
  path: "/:id/execute",
  tags: ["products"],
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: executeInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsProtectedApp.openapi(executeRoute, async (c) => {
  const session = assertSession(c)
  const { id: productId } = c.req.valid("param")
  const { inputs } = c.req.valid("json")

  const product = await getProductById(productId)

  if (!product) {
    throw new ApiError("NOT_FOUND", {
      message: `Product not found: ${productId}`,
    })
  }

  if (product.status !== "active") {
    throw new ApiError("BAD_REQUEST", {
      message: `Product not available: ${productId}`,
    })
  }

  if (product.apiKeyId === null) {
    throw new ApiError("BAD_REQUEST", {
      message: "Product is not configured with an API key",
    })
  }

  const apiKeys = await getApiKeys()
  const selectedKey = apiKeys.find((key) => key.id === product.apiKeyId)

  if (!selectedKey) {
    throw new ApiError("NOT_FOUND", {
      message: "The API key configured for this product no longer exists",
    })
  }

  if (selectedKey.status !== "active") {
    throw new ApiError("BAD_REQUEST", {
      message: "The API key configured for this product is inactive",
    })
  }

  const cost = Number(product.costPerRun ?? 0)

  const decryptedKey = decryptApiKey(selectedKey.apiKey).trim()
  if (!decryptedKey) {
    throw new ApiError("INTERNAL_SERVER_ERROR", {
      message: "Failed to decrypt API key",
    })
  }

  const productConfig = product.config as { modelEngine: string } | null

  if (productConfig === null) {
    throw new ApiError("BAD_REQUEST", {
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
      inputs,
      config: productConfig,
      outputFormat: product.outputFormat ?? "plain",
      apiKey: decryptedKey,
      provider: selectedKey.provider,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await insertProductRun({
      id: runId,
      productId,
      userId: session.id,
      inputs,
      outputs: { error: errorMessage },
      status: "failed",
      cost: String(cost),
      completedAt: new Date(),
    })
    throw new ApiError("INTERNAL_SERVER_ERROR", {
      message: `AI execution failed: ${errorMessage}`,
      cause: error,
    })
  }

  const output = execResult.output

  await insertProductRun({
    id: runId,
    productId,
    userId: session.id,
    inputs,
    outputs: { result: output },
    status: "completed",
    cost: String(cost),
    completedAt: new Date(),
  })

  return c.json(
    {
      runId,
      output,
      cost,
    },
    200,
  )
})

export const productsAdminApp = new OpenAPIHono<AppContext>()

productsAdminApp.use("*", requireAuth, requireAdmin)

const previewInputSchema = z.object({
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
})

const previewRoute = createRoute({
  method: "post",
  path: "/preview",
  tags: ["products"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: previewInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsAdminApp.openapi(previewRoute, async (c) => {
  const input = c.req.valid("json")

  validateRequiredInputs(input.inputs, input.inputVariable)
  validateSystemRole(input.systemRole)
  validateUserInstructionTemplate(input.userInstructionTemplate)
  validateApiKeyId(input.apiKeyId)

  const apiKeys = await getApiKeys()
  const selectedKey = apiKeys.find((key) => key.id === input.apiKeyId)

  if (!selectedKey) {
    throw new ApiError("BAD_REQUEST", {
      message: "Selected API key not found",
    })
  }

  if (selectedKey.status !== "active") {
    throw new ApiError("BAD_REQUEST", {
      message: "Selected API key is inactive",
    })
  }

  const decryptedKey = decryptApiKey(selectedKey.apiKey).trim()
  if (!decryptedKey) {
    throw new ApiError("INTERNAL_SERVER_ERROR", {
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
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (
      error instanceof Error &&
      (error.name === "ContextLengthError" ||
        error.name === "InvalidKeyError" ||
        error.name === "RateLimitError")
    ) {
      throw new ApiError("BAD_REQUEST", {
        message: `AI execution failed: ${errorMessage}`,
      })
    }

    throw new ApiError("INTERNAL_SERVER_ERROR", {
      message: `AI execution failed: ${errorMessage}`,
      cause: error,
    })
  }

  return c.json(
    {
      output: execResult.output,
      cost: 0,
    },
    200,
  )
})

const adminGetByIdRoute = createRoute({
  method: "get",
  path: "/admin/:id",
  tags: ["products"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsAdminApp.openapi(adminGetByIdRoute, async (c) => {
  const { id } = c.req.valid("param")
  const product = await getProductById(id)

  if (!product) {
    throw new ApiError("NOT_FOUND", {
      message: `Product not found: ${id}`,
    })
  }

  return c.json(product, 200)
})

const createItemRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["products"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertProductSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsAdminApp.openapi(createItemRoute, async (c) => {
  const session = assertSession(c)
  const input = c.req.valid("json")
  const { tagIds, categoryIds, thumbnailId, ...toolData } = input

  if (thumbnailId) {
    const asset = await getAssetById(thumbnailId)
    if (!asset) {
      throw new ApiError("NOT_FOUND", {
        message: `Asset not found: ${thumbnailId}`,
      })
    }
    if (asset.type !== "images") {
      throw new ApiError("BAD_REQUEST", {
        message: "Thumbnail must be an image asset",
      })
    }
  }

  if (categoryIds && categoryIds.length > 0) {
    const valid = await validateCategoryIds(categoryIds)
    if (!valid) {
      throw new ApiError("BAD_REQUEST", {
        message: "One or more category IDs are invalid",
      })
    }
  }

  if (tagIds && tagIds.length > 0) {
    const valid = await validateTagIds(tagIds)
    if (!valid) {
      throw new ApiError("BAD_REQUEST", {
        message: "One or more tag IDs are invalid",
      })
    }
  }

  const product = await createProduct({
    ...toolData,
    thumbnailId: thumbnailId ?? undefined,
    categoryIds,
    tagIds,
    createdBy: session.id,
  })

  return c.json(product, 200)
})

const updateRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["products"],
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateProductSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsAdminApp.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid("param")
  const input = c.req.valid("json")

  if (!id) {
    throw new ApiError("BAD_REQUEST", {
      message: "Product ID is required",
    })
  }

  const { tagIds, categoryIds, thumbnailId, ...data } = input

  if (thumbnailId) {
    const asset = await getAssetById(thumbnailId)
    if (!asset) {
      throw new ApiError("NOT_FOUND", {
        message: `Asset not found: ${thumbnailId}`,
      })
    }
    if (asset.type !== "images") {
      throw new ApiError("BAD_REQUEST", {
        message: "Thumbnail must be an image asset",
      })
    }
  }

  if (categoryIds && categoryIds.length > 0) {
    const valid = await validateCategoryIds(categoryIds)
    if (!valid) {
      throw new ApiError("BAD_REQUEST", {
        message: "One or more category IDs are invalid",
      })
    }
  }

  if (tagIds && tagIds.length > 0) {
    const valid = await validateTagIds(tagIds)
    if (!valid) {
      throw new ApiError("BAD_REQUEST", {
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

  return c.json(product, 200)
})

const deleteRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["products"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean() })),
  },
})

productsAdminApp.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid("param")
  await deleteProduct(id)
  return c.json({ success: true }, 200)
})

const duplicateRoute = createRoute({
  method: "post",
  path: "/:id/duplicate",
  tags: ["products"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsAdminApp.openapi(duplicateRoute, async (c) => {
  const session = assertSession(c)
  const { id } = c.req.valid("param")
  const product = await duplicateProduct(id, session.id)
  return c.json(product, 200)
})

const bulkUpdateStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(["draft", "active", "archived"]),
})

const bulkUpdateStatusRoute = createRoute({
  method: "patch",
  path: "/status/bulk",
  tags: ["products"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: bulkUpdateStatusInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

productsAdminApp.openapi(bulkUpdateStatusRoute, async (c) => {
  const { ids, status } = c.req.valid("json")
  return c.json(await updateProductStatus(ids, status), 200)
})
