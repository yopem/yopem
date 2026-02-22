import z from "zod"

export const sharedSchema = {
  APP_ENV: z.enum(["development", "production", "test"]).default("development"),
}

export const serverSchema = {
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  REDIS_KEY_PREFIX: z.string().default("yopem:"),

  AUTH_ISSUER: z.string().min(1),

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
}

export const clientSchema = {
  NEXT_PUBLIC_API_URL: z.string().min(1),

  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1),
  NEXT_PUBLIC_UMAMI_TRACKING_ID: z.string().min(1).optional(),

  NEXT_PUBLIC_LOGO_URL: z.string().min(1),
  NEXT_PUBLIC_LOGO_OG_URL: z.string().min(1),
  NEXT_PUBLIC_LOGO_OG_WIDTH: z.string().min(1),
  NEXT_PUBLIC_LOGO_OG_HEIGHT: z.string().min(1),

  NEXT_PUBLIC_SITE_DESCRIPTION: z.string().min(1),
  NEXT_PUBLIC_SITE_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_ADMIN_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_TAGLINE: z.string().min(1),
  NEXT_PUBLIC_SITE_TITLE: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().min(1),

  NEXT_PUBLIC_FACEBOOK_USERNAME: z.string().min(1),
  NEXT_PUBLIC_INSTAGRAM_USERNAME: z.string().min(1),
  NEXT_PUBLIC_TIKTOK_USERNAME: z.string().min(1),
  NEXT_PUBLIC_WHATSAPP_CHANNEL_USERNAME: z.string().min(1),
  NEXT_PUBLIC_X_USERNAME: z.string().min(1),
  NEXT_PUBLIC_YOUTUBE_USERNAME: z.string().min(1),
}

export const honoServerSchema = {
  ...sharedSchema,
  ...serverSchema,
  NEXT_PUBLIC_API_URL: z.string().min(1),
  WEB_ORIGIN: z.string().min(1).optional(),
  ADMIN_ORIGIN: z.string().min(1).optional(),
  SERVER_PORT: z.coerce.number().default(4000),
  COOKIE_DOMAIN: z.string().optional(),
}
