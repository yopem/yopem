export const appEnv = process.env["APP_ENV"]
export const databaseUrl = process.env["DATABASE_URL"]

export const authSecret = process.env["BETTER_AUTH_SECRET"]
export const authURl = process.env["BETTER_AUTH_URL"]

export const googleClientId = process.env["GOOGLE_CLIENT_ID"]
export const googleClientSecret = process.env["GOOGLE_CLIENT_SECRET"]
export const googleRedirectUrl = process.env["GOOGLE_REDIRECT_URL"]

export const cfAccountId = process.env["CF_ACCOUNT_ID"]
export const r2AccessKey = process.env["R2_ACCESS_KEY"]
export const r2SecretKey = process.env["R2_SECRET_KEY"]
export const r2Bucket = process.env["R2_BUCKET"]
export const r2Domain = process.env["R2_DOMAIN"]
export const r2Region = process.env["R2_REGION"]

export const apiUrl = process.env["NEXT_PUBLIC_API_URL"]

export const logoUrl = process.env["NEXT_PUBLIC_LOGO_URL"]
export const logoOgUrl = process.env["NEXT_PUBLIC_LOGO_OG_URL"]
export const logoOgWidth = process.env["NEXT_PUBLIC_LOGO_OG_WIDTH"]
export const logoOgHeight = process.env["NEXT_PUBLIC_LOGO_OG_HEIGHT"]

export const siteDescription = process.env["NEXT_PUBLIC_SITE_DESCRIPTION"]
export const siteTagline = process.env["NEXT_PUBLIC_SITE_TAGLINE"]
export const siteTitle = process.env["NEXT_PUBLIC_SITE_TITLE"]
export const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"]
export const siteDomain = new URL(siteUrl ?? "").host
export const supportEmail = process.env["NEXT_PUBLIC_SUPPORT_EMAIL"]

export const facebookUsername = process.env["NEXT_PUBLIC_FACEBOOK_USERNAME"]
export const instagramUsername = process.env["NEXT_PUBLIC_INSTAGRAM_USERNAME"]
export const tiktokUsername = process.env["NEXT_PUBLIC_TIKTOK_USERNAME"]
export const whatsappChannelUsername =
  process.env["NEXT_PUBLIC_WHATSAPP_CHANNEL_USERNAME"]
export const xUsername = process.env["NEXT_PUBLIC_X_USERNAME"]
export const youtubeUsername = process.env["NEXT_PUBLIC_YOUTUBE_USERNAME"]
