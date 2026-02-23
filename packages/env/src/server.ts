import "server-only"
import { env } from "./index"

export const appEnv = env.APP_ENV
export const databaseUrl = env.DATABASE_URL
export const redisUrl = env.REDIS_URL
export const redisKeyPrefix = env.REDIS_KEY_PREFIX

export const polarAccessToken = env.POLAR_ACCESS_TOKEN
export const polarWebhookSecret = env.POLAR_WEBHOOK_SECRET
export const polarProductId = env.POLAR_PRODUCT_ID

export const authIssuer = env.AUTH_ISSUER

export const cfAccountId = env.CF_ACCOUNT_ID
export const r2AccessKey = env.R2_ACCESS_KEY
export const r2SecretKey = env.R2_SECRET_KEY
export const r2Bucket = env.R2_BUCKET
export const r2Domain = env.R2_DOMAIN
export const r2Region = env.R2_REGION
