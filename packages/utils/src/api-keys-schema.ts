import { z } from "zod"

export const apiKeyProviderSchema = z.enum(["openai", "openrouter"])

export type ApiKeyProvider = z.infer<typeof apiKeyProviderSchema>

const apiKeyStatusSchema = z.enum(["active", "inactive"])

const apiKeyRestrictionsSchema = z.object({
  enabled: z.boolean(),
  projectIds: z.array(z.string()).optional(),
})

export const apiKeyConfigSchema = z.object({
  id: z.string(),
  provider: apiKeyProviderSchema,
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  apiKey: z.string().min(1, "API key is required"),
  status: apiKeyStatusSchema,
  restrictions: apiKeyRestrictionsSchema.optional(),
  lastUsed: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ApiKeyConfig = z.infer<typeof apiKeyConfigSchema>

export const addApiKeyInputSchema = z.object({
  provider: apiKeyProviderSchema,
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  apiKey: z.string().min(1, "API key is required"),
  status: apiKeyStatusSchema.default("active"),
  restrictions: apiKeyRestrictionsSchema.optional(),
})

export type AddApiKeyInput = z.infer<typeof addApiKeyInputSchema>

export const updateApiKeyInputSchema = z.object({
  id: z.string(),
  provider: apiKeyProviderSchema.optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  apiKey: z.string().min(1, "API key is required").optional(),
  status: apiKeyStatusSchema.optional(),
  restrictions: apiKeyRestrictionsSchema.optional(),
})

export type UpdateApiKeyInput = z.infer<typeof updateApiKeyInputSchema>

export const deleteApiKeyInputSchema = z.object({
  id: z.string(),
})

export type DeleteApiKeyInput = z.infer<typeof deleteApiKeyInputSchema>
