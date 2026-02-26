import { createEnv } from "@t3-oss/env-core"

import { clientSchema, serverSchema, sharedSchema } from "./schema"

function getProtocol() {
  if (process.env["APP_ENV"] === "development") {
    return "http://"
  }
  return "https://"
}

export const env = createEnv({
  shared: sharedSchema,
  server: serverSchema,
  clientPrefix: "PUBLIC_",
  client: clientSchema,
  runtimeEnv: {
    APP_ENV: process.env["APP_ENV"] ?? "development",

    DATABASE_URL: process.env["DATABASE_URL"],
    REDIS_URL: process.env["REDIS_URL"],
    REDIS_KEY_PREFIX: process.env["REDIS_KEY_PREFIX"],
    AUTH_ISSUER: process.env["AUTH_ISSUER"],
    API_KEY_ENCRYPTION_SECRET: process.env["API_KEY_ENCRYPTION_SECRET"],
    POLAR_ACCESS_TOKEN: process.env["POLAR_ACCESS_TOKEN"],
    POLAR_WEBHOOK_SECRET: process.env["POLAR_WEBHOOK_SECRET"],
    POLAR_PRODUCT_ID: process.env["POLAR_PRODUCT_ID"],
    CF_ACCOUNT_ID: process.env["CF_ACCOUNT_ID"],
    R2_ACCESS_KEY: process.env["R2_ACCESS_KEY"],
    R2_SECRET_KEY: process.env["R2_SECRET_KEY"],
    R2_BUCKET: process.env["R2_BUCKET"],
    R2_DOMAIN: process.env["R2_DOMAIN"],
    R2_REGION: process.env["R2_REGION"],

    PUBLIC_API_URL: process.env["PUBLIC_API_URL"] ?? "",

    PUBLIC_UMAMI_TRACKING_ID: process.env["PUBLIC_UMAMI_TRACKING_ID"],
    PUBLIC_GA_MEASUREMENT_ID: process.env["PUBLIC_GA_MEASUREMENT_ID"],

    PUBLIC_LOGO_URL: process.env["PUBLIC_LOGO_URL"],
    PUBLIC_LOGO_OG_URL: process.env["PUBLIC_LOGO_OG_URL"],
    PUBLIC_LOGO_OG_WIDTH: process.env["PUBLIC_LOGO_OG_WIDTH"],
    PUBLIC_LOGO_OG_HEIGHT: process.env["PUBLIC_LOGO_OG_HEIGHT"],

    PUBLIC_SITE_DESCRIPTION: process.env["PUBLIC_SITE_DESCRIPTION"],
    PUBLIC_SITE_DOMAIN: process.env["PUBLIC_SITE_DOMAIN"],
    PUBLIC_ADMIN_URL: process.env["PUBLIC_ADMIN_URL"],
    PUBLIC_SITE_TAGLINE: process.env["PUBLIC_SITE_TAGLINE"],
    PUBLIC_SITE_TITLE: process.env["PUBLIC_SITE_TITLE"],
    PUBLIC_SITE_URL: `${getProtocol()}${process.env["PUBLIC_SITE_DOMAIN"]}`,
    PUBLIC_SUPPORT_EMAIL: process.env["PUBLIC_SUPPORT_EMAIL"],

    PUBLIC_FACEBOOK_USERNAME: process.env["PUBLIC_FACEBOOK_USERNAME"],
    PUBLIC_INSTAGRAM_USERNAME: process.env["PUBLIC_INSTAGRAM_USERNAME"],
    PUBLIC_TIKTOK_USERNAME: process.env["PUBLIC_TIKTOK_USERNAME"],
    PUBLIC_WHATSAPP_CHANNEL_USERNAME:
      process.env["PUBLIC_WHATSAPP_CHANNEL_USERNAME"],
    PUBLIC_X_USERNAME: process.env["PUBLIC_X_USERNAME"],
    PUBLIC_YOUTUBE_USERNAME: process.env["PUBLIC_YOUTUBE_USERNAME"],
  },
  skipValidation:
    !!process.env["CI"] || process.env["npm_lifecycle_event"] === "lint",
})
