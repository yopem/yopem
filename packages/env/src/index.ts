import { z } from "zod"

declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
    readonly SSR: boolean
    readonly BASE_URL: string
    readonly PUBLIC_API_URL: string
    readonly PUBLIC_GA_MEASUREMENT_ID: string
    readonly PUBLIC_UMAMI_TRACKING_ID: string
    readonly PUBLIC_LOGO_URL: string
    readonly PUBLIC_LOGO_OG_URL: string
    readonly PUBLIC_LOGO_OG_WIDTH: string
    readonly PUBLIC_LOGO_OG_HEIGHT: string
    readonly PUBLIC_SITE_DESCRIPTION: string
    readonly PUBLIC_SITE_DOMAIN: string
    readonly PUBLIC_ADMIN_URL: string
    readonly PUBLIC_SITE_TAGLINE: string
    readonly PUBLIC_SITE_TITLE: string
    readonly PUBLIC_SITE_URL: string
    readonly PUBLIC_SUPPORT_EMAIL: string
    readonly PUBLIC_FACEBOOK_USERNAME: string
    readonly PUBLIC_INSTAGRAM_USERNAME: string
    readonly PUBLIC_TIKTOK_USERNAME: string
    readonly PUBLIC_WHATSAPP_CHANNEL_USERNAME: string
    readonly PUBLIC_X_USERNAME: string
    readonly PUBLIC_YOUTUBE_USERNAME: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

const protocol = import.meta.env?.DEV ? "http://" : "https://"

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  REDIS_KEY_PREFIX: z.string().default("yopem:"),

  AUTH_ISSUER: z.string().min(1),
  COOKIE_DOMAIN: z.string().optional(),

  API_KEY_ENCRYPTION_SECRET: z.string().min(1),

  POLAR_ACCESS_TOKEN: z.string().min(1),
  POLAR_WEBHOOK_SECRET: z.string().min(1),
  POLAR_PRODUCT_ID: z.string().min(1),

  CF_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY: z.string().min(1),
  R2_SECRET_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_DOMAIN: z.string().min(1),
  R2_REGION: z.string().min(1),

  WEB_ORIGIN: z.string().min(1).optional(),
  ADMIN_ORIGIN: z.string().min(1).optional(),
  AUTH_CALLBACK_URL: z.string().min(1).optional(),

  SERVER_PORT: z.coerce.number().default(4000),
  WEB_PORT: z.coerce.number().default(3000),
  ADMIN_PORT: z.coerce.number().default(3001),

  PUBLIC_API_URL: z.string().min(1),

  PUBLIC_GA_MEASUREMENT_ID: z.string().default(""),
  PUBLIC_UMAMI_TRACKING_ID: z.string().optional(),

  PUBLIC_LOGO_URL: z.string().default(""),
  PUBLIC_LOGO_OG_URL: z.string().default(""),
  PUBLIC_LOGO_OG_WIDTH: z.string().default("1200"),
  PUBLIC_LOGO_OG_HEIGHT: z.string().default("630"),

  PUBLIC_SITE_DESCRIPTION: z.string().min(1),
  PUBLIC_SITE_DOMAIN: z.string().min(1),
  PUBLIC_ADMIN_URL: z.string().optional(),
  PUBLIC_SITE_TAGLINE: z.string().min(1),
  PUBLIC_SITE_TITLE: z.string().min(1),
  PUBLIC_SITE_URL: z.string().min(1),
  PUBLIC_SUPPORT_EMAIL: z.string().min(1),

  PUBLIC_FACEBOOK_USERNAME: z.string().default(""),
  PUBLIC_INSTAGRAM_USERNAME: z.string().default(""),
  PUBLIC_TIKTOK_USERNAME: z.string().default(""),
  PUBLIC_WHATSAPP_CHANNEL_USERNAME: z.string().default(""),
  PUBLIC_X_USERNAME: z.string().default(""),
  PUBLIC_YOUTUBE_USERNAME: z.string().default(""),
})

const mergedEnv = {
  ...process.env,
  PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
  PUBLIC_GA_MEASUREMENT_ID: import.meta.env.PUBLIC_GA_MEASUREMENT_ID,
  PUBLIC_UMAMI_TRACKING_ID: import.meta.env.PUBLIC_UMAMI_TRACKING_ID,
  PUBLIC_LOGO_URL: import.meta.env.PUBLIC_LOGO_URL,
  PUBLIC_LOGO_OG_URL: import.meta.env.PUBLIC_LOGO_OG_URL,
  PUBLIC_LOGO_OG_WIDTH: import.meta.env.PUBLIC_LOGO_OG_WIDTH,
  PUBLIC_LOGO_OG_HEIGHT: import.meta.env.PUBLIC_LOGO_OG_HEIGHT,
  PUBLIC_SITE_DESCRIPTION: import.meta.env.PUBLIC_SITE_DESCRIPTION,
  PUBLIC_SITE_DOMAIN: import.meta.env.PUBLIC_SITE_DOMAIN,
  PUBLIC_ADMIN_URL: import.meta.env.PUBLIC_ADMIN_URL,
  PUBLIC_SITE_TAGLINE: import.meta.env.PUBLIC_SITE_TAGLINE,
  PUBLIC_SITE_TITLE: import.meta.env.PUBLIC_SITE_TITLE,
  PUBLIC_SITE_URL: `${protocol}${import.meta.env.PUBLIC_SITE_DOMAIN}`,
  PUBLIC_SUPPORT_EMAIL: import.meta.env.PUBLIC_SUPPORT_EMAIL,
  PUBLIC_FACEBOOK_USERNAME: import.meta.env.PUBLIC_FACEBOOK_USERNAME,
  PUBLIC_INSTAGRAM_USERNAME: import.meta.env.PUBLIC_INSTAGRAM_USERNAME,
  PUBLIC_TIKTOK_USERNAME: import.meta.env.PUBLIC_TIKTOK_USERNAME,
  PUBLIC_WHATSAPP_CHANNEL_USERNAME: import.meta.env
    .PUBLIC_WHATSAPP_CHANNEL_USERNAME,
  PUBLIC_X_USERNAME: import.meta.env.PUBLIC_X_USERNAME,
  PUBLIC_YOUTUBE_USERNAME: import.meta.env.PUBLIC_YOUTUBE_USERNAME,
}

const isBrowser =
  typeof window !== "undefined" || typeof document !== "undefined"

const skipValidation =
  isBrowser ||
  process.env["CI"] !== undefined ||
  process.env["npm_lifecycle_event"] === "lint"

export const env = skipValidation
  ? (mergedEnv as unknown as z.infer<typeof schema>)
  : schema.parse(mergedEnv)

export const databaseUrl = env.DATABASE_URL
export const redisUrl = env.REDIS_URL
export const redisKeyPrefix = env.REDIS_KEY_PREFIX

export const authIssuer = env.AUTH_ISSUER
export const cookieDomain = env.COOKIE_DOMAIN

export const polarAccessToken = env.POLAR_ACCESS_TOKEN
export const polarWebhookSecret = env.POLAR_WEBHOOK_SECRET
export const polarProductId = env.POLAR_PRODUCT_ID

export const cfAccountId = env.CF_ACCOUNT_ID
export const r2AccessKey = env.R2_ACCESS_KEY
export const r2SecretKey = env.R2_SECRET_KEY
export const r2Bucket = env.R2_BUCKET
export const r2Domain = env.R2_DOMAIN
export const r2Region = env.R2_REGION

export const webOrigin = env.WEB_ORIGIN
export const adminOrigin = env.ADMIN_ORIGIN
export const authCallbackUrl = env.AUTH_CALLBACK_URL

export const serverPort = env.SERVER_PORT
export const webPort = env.WEB_PORT
export const adminPort = env.ADMIN_PORT

export const apiUrl = env.PUBLIC_API_URL
export const siteDomain = env.PUBLIC_SITE_DOMAIN
export const siteUrl = env.PUBLIC_SITE_URL

export const gaMeasurementId = env.PUBLIC_GA_MEASUREMENT_ID
export const umamiTrackingId = env.PUBLIC_UMAMI_TRACKING_ID

export const logoUrl = env.PUBLIC_LOGO_URL
export const logoOgUrl = env.PUBLIC_LOGO_OG_URL
export const logoOgWidth = env.PUBLIC_LOGO_OG_WIDTH
export const logoOgHeight = env.PUBLIC_LOGO_OG_HEIGHT

export const siteDescription = env.PUBLIC_SITE_DESCRIPTION
export const siteTagline = env.PUBLIC_SITE_TAGLINE
export const siteTitle = env.PUBLIC_SITE_TITLE
export const supportEmail = env.PUBLIC_SUPPORT_EMAIL
export const adminUrl = env.PUBLIC_ADMIN_URL

export const facebookUsername = env.PUBLIC_FACEBOOK_USERNAME
export const instagramUsername = env.PUBLIC_INSTAGRAM_USERNAME
export const tiktokUsername = env.PUBLIC_TIKTOK_USERNAME
export const whatsappChannelUsername = env.PUBLIC_WHATSAPP_CHANNEL_USERNAME
export const xUsername = env.PUBLIC_X_USERNAME
export const youtubeUsername = env.PUBLIC_YOUTUBE_USERNAME
