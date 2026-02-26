import z from "zod"

import { honoServerSchema } from "./schema"

const skipValidation =
  !!process.env["CI"] || process.env["npm_lifecycle_event"] === "lint"

const schema = z.object(honoServerSchema)

type EnvData = z.infer<typeof schema>

const parsed = skipValidation
  ? { success: true as const, data: process.env as unknown as EnvData }
  : schema.safeParse(process.env)

if (!parsed.success) {
  const formatted = (
    parsed as { success: false; error: z.ZodError }
  ).error.flatten().fieldErrors
  const missing = Object.entries(formatted)
    .map(([key, errors]) => `  ${key}: ${(errors as string[])?.join(", ")}`)
    .join("\n")
  throw new Error(`[env] Missing or invalid environment variables:\n${missing}`)
}

export const honoEnv = parsed.data

export const appEnv = parsed.data.APP_ENV
export const databaseUrl = parsed.data.DATABASE_URL
export const redisUrl = parsed.data.REDIS_URL
export const redisKeyPrefix = parsed.data.REDIS_KEY_PREFIX

export const polarAccessToken = parsed.data.POLAR_ACCESS_TOKEN
export const polarWebhookSecret = parsed.data.POLAR_WEBHOOK_SECRET
export const polarProductId = parsed.data.POLAR_PRODUCT_ID

export const authIssuer = parsed.data.AUTH_ISSUER

export const cfAccountId = parsed.data.CF_ACCOUNT_ID
export const r2AccessKey = parsed.data.R2_ACCESS_KEY
export const r2SecretKey = parsed.data.R2_SECRET_KEY
export const r2Bucket = parsed.data.R2_BUCKET
export const r2Domain = parsed.data.R2_DOMAIN
export const r2Region = parsed.data.R2_REGION

export const siteDomain = parsed.data.PUBLIC_SITE_DOMAIN
export const apiUrl = parsed.data.PUBLIC_API_URL
