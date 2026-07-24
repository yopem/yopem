declare global {
  interface ImportMetaEnv {
    DEV: boolean
    PROD: boolean
    [key: string]: string | boolean | undefined
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

const getString = (key: string, fallback = ""): string =>
  (process.env[key] ?? import.meta.env[key] ?? fallback) as string

const getNumber = (key: string, fallback: number): number => {
  const value = process.env[key] ?? import.meta.env[key]
  if (value === undefined) return fallback
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

const getBoolean = (key: string): boolean =>
  (process.env[key] ?? import.meta.env[key]) === "true"

const protocol = import.meta.env?.DEV ? "http://" : "https://"

export const databaseUrl = getString("DATABASE_URL")
export const redisUrl = getString("REDIS_URL")
export const redisKeyPrefix = getString("REDIS_KEY_PREFIX", "yopem:")

export const authIssuer = getString("AUTH_ISSUER")
export const cookieDomain = getString("COOKIE_DOMAIN")

export const apiKeyEncryptionSecret = getString("API_KEY_ENCRYPTION_SECRET")

export const polarAccessToken = getString("POLAR_ACCESS_TOKEN")
export const polarWebhookSecret = getString("POLAR_WEBHOOK_SECRET")
export const polarProductId = getString("POLAR_PRODUCT_ID")

export const cfAccountId = getString("CF_ACCOUNT_ID")
export const r2AccessKey = getString("R2_ACCESS_KEY")
export const r2SecretKey = getString("R2_SECRET_KEY")
export const r2Bucket = getString("R2_BUCKET")
export const r2Domain = getString("R2_DOMAIN")
export const r2Region = getString("R2_REGION")

export const webOrigin = getString("WEB_ORIGIN")
export const adminOrigin = getString("ADMIN_ORIGIN")
export const authCallbackUrl = getString("AUTH_CALLBACK_URL")

export const serverPort = getNumber("SERVER_PORT", 4000)
export const webPort = getNumber("WEB_PORT", 3000)
export const adminPort = getNumber("ADMIN_PORT", 3001)

export const apiUrl = getString("PUBLIC_API_URL")
export const siteDomain = getString("PUBLIC_SITE_DOMAIN")
export const siteUrl = getString(
  "PUBLIC_SITE_URL",
  `${protocol}${getString("PUBLIC_SITE_DOMAIN")}`,
)

export const gaMeasurementId = getString("PUBLIC_GA_MEASUREMENT_ID")
export const umamiTrackingId = getString("PUBLIC_UMAMI_TRACKING_ID")

export const logoUrl = getString("PUBLIC_LOGO_URL")
export const logoOgUrl = getString("PUBLIC_LOGO_OG_URL")
export const logoOgWidth = getString("PUBLIC_LOGO_OG_WIDTH", "1200")
export const logoOgHeight = getString("PUBLIC_LOGO_OG_HEIGHT", "630")

export const siteDescription = getString("PUBLIC_SITE_DESCRIPTION")
export const siteTagline = getString("PUBLIC_SITE_TAGLINE")
export const siteTitle = getString("PUBLIC_SITE_TITLE")
export const supportEmail = getString("PUBLIC_SUPPORT_EMAIL")
export const adminUrl = getString("PUBLIC_ADMIN_URL")

export const facebookUsername = getString("PUBLIC_FACEBOOK_USERNAME")
export const instagramUsername = getString("PUBLIC_INSTAGRAM_USERNAME")
export const tiktokUsername = getString("PUBLIC_TIKTOK_USERNAME")
export const whatsappChannelUsername = getString(
  "PUBLIC_WHATSAPP_CHANNEL_USERNAME",
)
export const xUsername = getString("PUBLIC_X_USERNAME")
export const youtubeUsername = getString("PUBLIC_YOUTUBE_USERNAME")

export const isDev = import.meta.env?.DEV ?? getBoolean("DEV")
export const isProd = import.meta.env?.PROD ?? !isDev
