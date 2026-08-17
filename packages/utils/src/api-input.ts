import * as v from "valibot"

export const apiKeyProviderSchema = v.picklist(["openai", "openrouter", "fal"])

export type ApiKeyProvider = v.InferOutput<typeof apiKeyProviderSchema>

const apiKeyStatusSchema = v.picklist(["active", "inactive"])

const apiKeyRestrictionsSchema = v.object({
  enabled: v.boolean(),
  projectIds: v.optional(v.array(v.string())),
})

export const apiKeyConfigSchema = v.object({
  id: v.string(),
  provider: apiKeyProviderSchema,
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  description: v.optional(v.string()),
  apiKey: v.pipe(v.string(), v.minLength(1, "API key is required")),
  status: apiKeyStatusSchema,
  restrictions: v.optional(apiKeyRestrictionsSchema),
  lastUsed: v.optional(v.date()),
  createdAt: v.pipe(v.string(), v.isoDate()),
  updatedAt: v.pipe(v.string(), v.isoDate()),
})

export type ApiKeyConfig = v.InferOutput<typeof apiKeyConfigSchema>

export const addApiKeyInputSchema = v.object({
  provider: apiKeyProviderSchema,
  name: v.pipe(
    v.string(),
    v.minLength(1, "Name is required"),
    v.maxLength(100, "Name too long"),
  ),
  description: v.optional(
    v.pipe(v.string(), v.maxLength(500, "Description too long")),
  ),
  apiKey: v.pipe(v.string(), v.trim(), v.minLength(1, "API key is required")),
  status: v.optional(apiKeyStatusSchema, "active"),
  restrictions: v.optional(apiKeyRestrictionsSchema),
  skipValidation: v.optional(v.boolean(), false),
})

export type AddApiKeyInput = v.InferOutput<typeof addApiKeyInputSchema>

export const updateApiKeyInputSchema = v.object({
  id: v.string(),
  provider: v.optional(apiKeyProviderSchema),
  name: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1, "Name is required"),
      v.maxLength(100, "Name too long"),
    ),
  ),
  description: v.optional(
    v.pipe(v.string(), v.maxLength(500, "Description too long")),
  ),
  apiKey: v.optional(
    v.pipe(v.string(), v.trim(), v.minLength(1, "API key is required")),
  ),
  status: v.optional(apiKeyStatusSchema),
  restrictions: v.optional(apiKeyRestrictionsSchema),
  skipValidation: v.optional(v.boolean(), false),
})

export type UpdateApiKeyInput = v.InferOutput<typeof updateApiKeyInputSchema>

export const deleteApiKeyInputSchema = v.object({
  id: v.string(),
})

export type DeleteApiKeyInput = v.InferOutput<typeof deleteApiKeyInputSchema>
