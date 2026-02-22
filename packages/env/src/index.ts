import { createEnv } from "@t3-oss/env-nextjs"

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
  client: clientSchema,
  experimental__runtimeEnv: {
    APP_ENV: process.env["APP_ENV"] ?? "development",
    NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"] ?? "",

    NEXT_PUBLIC_UMAMI_TRACKING_ID: process.env["NEXT_PUBLIC_UMAMI_TRACKING_ID"],
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env["NEXT_PUBLIC_GA_MEASUREMENT_ID"],

    NEXT_PUBLIC_LOGO_URL: process.env["NEXT_PUBLIC_LOGO_URL"],
    NEXT_PUBLIC_LOGO_OG_URL: process.env["NEXT_PUBLIC_LOGO_OG_URL"],
    NEXT_PUBLIC_LOGO_OG_WIDTH: process.env["NEXT_PUBLIC_LOGO_OG_WIDTH"],
    NEXT_PUBLIC_LOGO_OG_HEIGHT: process.env["NEXT_PUBLIC_LOGO_OG_HEIGHT"],

    NEXT_PUBLIC_SITE_DESCRIPTION: process.env["NEXT_PUBLIC_SITE_DESCRIPTION"],
    NEXT_PUBLIC_SITE_DOMAIN: process.env["NEXT_PUBLIC_SITE_DOMAIN"],
    NEXT_PUBLIC_ADMIN_URL: process.env["NEXT_PUBLIC_ADMIN_URL"],
    NEXT_PUBLIC_SITE_TAGLINE: process.env["NEXT_PUBLIC_SITE_TAGLINE"],
    NEXT_PUBLIC_SITE_TITLE: process.env["NEXT_PUBLIC_SITE_TITLE"],
    NEXT_PUBLIC_SITE_URL: `${getProtocol()}${process.env["NEXT_PUBLIC_SITE_DOMAIN"]}`,
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env["NEXT_PUBLIC_SUPPORT_EMAIL"],

    NEXT_PUBLIC_FACEBOOK_USERNAME: process.env["NEXT_PUBLIC_FACEBOOK_USERNAME"],
    NEXT_PUBLIC_INSTAGRAM_USERNAME:
      process.env["NEXT_PUBLIC_INSTAGRAM_USERNAME"],
    NEXT_PUBLIC_TIKTOK_USERNAME: process.env["NEXT_PUBLIC_TIKTOK_USERNAME"],
    NEXT_PUBLIC_WHATSAPP_CHANNEL_USERNAME:
      process.env["NEXT_PUBLIC_WHATSAPP_CHANNEL_USERNAME"],
    NEXT_PUBLIC_X_USERNAME: process.env["NEXT_PUBLIC_X_USERNAME"],
    NEXT_PUBLIC_YOUTUBE_USERNAME: process.env["NEXT_PUBLIC_YOUTUBE_USERNAME"],
  },
  skipValidation:
    !!process.env["CI"] || process.env["npm_lifecycle_event"] === "lint",
})
