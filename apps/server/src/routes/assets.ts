import type { AppContext } from "server/context"

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { ApiError } from "server/errors"
import { requireAdmin, requireAuth } from "server/middleware"
import { getR2Storage } from "server/storage"
import { z } from "zod"

import { redisCache } from "cache"
import { getOrCompute } from "cache/services/with-cache"
import {
  deleteAsset,
  getAdminUploadSizeSetting,
  getAssetById,
  insertAsset,
  listAssets,
} from "db/services/assets"
import { r2Domain } from "env"

import { cursorQuerySchema, idParamSchema, jsonOkResponse } from "./common"

const MAX_UPLOAD_SIZE_MB = 50
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb"
const SETTINGS_CACHE_TTL = 300

const getMaxUploadSizeMB = () =>
  getOrCompute(
    redisCache,
    `settings:${ASSETS_MAX_SIZE_KEY}`,
    async () => {
      const settings = await getAdminUploadSizeSetting(ASSETS_MAX_SIZE_KEY)
      return settings && typeof settings.settingValue === "number"
        ? settings.settingValue
        : MAX_UPLOAD_SIZE_MB
    },
    SETTINGS_CACHE_TTL,
  )

export const assetsPublicApp = new OpenAPIHono<AppContext>()

const uploadSettingsRoute = createRoute({
  method: "get",
  path: "/upload-settings",
  tags: ["assets"],
  responses: {
    200: jsonOkResponse(),
  },
})

assetsPublicApp.openapi(uploadSettingsRoute, async (c) => {
  const maxSizeMB = await getMaxUploadSizeMB()

  return c.json(
    {
      maxSizeMB,
      maxSizeBytes: maxSizeMB * 1024 * 1024,
    },
    200,
  )
})

export const assetsProtectedApp = new OpenAPIHono<AppContext>()

assetsProtectedApp.use("*", requireAuth)

const listAssetsQuerySchema = cursorQuerySchema.extend({
  type: z
    .enum(["images", "videos", "documents", "archives", "others"])
    .optional(),
})

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["assets"],
  request: {
    query: listAssetsQuerySchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

assetsProtectedApp.openapi(listRoute, async (c) => {
  const { limit, cursor, type } = c.req.valid("query")

  return c.json(
    await listAssets({
      limit: limit ?? 20,
      cursor,
      type,
    }),
    200,
  )
})

export const assetsAdminApp = new OpenAPIHono<AppContext>()

assetsAdminApp.use("*", requireAuth, requireAdmin)

const uploadRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["assets"],
  responses: {
    200: jsonOkResponse(),
  },
})

assetsAdminApp.openapi(uploadRoute, async (c) => {
  const body = await c.req.parseBody()
  const file = Array.isArray(body.file) ? body.file[0] : body.file

  if (!(file instanceof File)) {
    throw new ApiError("BAD_REQUEST", { message: "Missing file" })
  }

  const maxSizeMB = await getMaxUploadSizeMB()
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  if (file.size > maxSizeBytes) {
    throw new ApiError("BAD_REQUEST", {
      message: `File size exceeds ${maxSizeMB}MB limit`,
    })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const r2 = getR2Storage()

  let uploadResult: {
    url: string
    type: "images" | "videos" | "documents" | "archives" | "others"
    size: number
    key: string
  }

  try {
    uploadResult = await r2.uploadAsset(
      buffer,
      file.name,
      file.type || "application/octet-stream",
    )
  } catch (error) {
    throw new ApiError("BAD_REQUEST", {
      message: `Failed to upload asset: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  const { url, type, size, key } = uploadResult

  const asset = await insertAsset({
    filename: key.split("/").pop()!,
    originalName: file.name,
    type,
    size,
    url,
  })

  return c.json(asset, 200)
})

const deleteRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["assets"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean() })),
  },
})

assetsAdminApp.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid("param")
  const asset = await getAssetById(id)

  if (!asset) {
    throw new ApiError("NOT_FOUND", {
      message: `Asset not found: ${id}`,
    })
  }

  const r2 = getR2Storage()
  const key = asset.url.replace(r2Domain, "").replace(/^\//, "")

  try {
    await r2.deleteFile(key)
  } catch (error) {
    throw new ApiError("BAD_REQUEST", {
      message: `Failed to delete asset from storage: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  await deleteAsset(id)

  return c.json({ success: true }, 200)
})
