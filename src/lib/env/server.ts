import "server-only"

import { env } from "@/lib/env"

export const appEnv = env.APP_ENV
export const databaseUrl = env.DATABASE_URL

export const googleClientId = env.GOOGLE_CLIENT_ID
export const googleClientSecret = env.GOOGLE_CLIENT_SECRET
export const googleRedirectUrl = env.GOOGLE_REDIRECT_URL

export const cfAccountId = env.CF_ACCOUNT_ID
export const r2AccessKey = env.R2_ACCESS_KEY
export const r2SecretKey = env.R2_SECRET_KEY
export const r2Bucket = env.R2_BUCKET
export const r2Domain = env.R2_DOMAIN
export const r2Region = env.R2_REGION
