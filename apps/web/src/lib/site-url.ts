import { siteUrl } from "env"

export const getSiteUrl = (): string => siteUrl || "http://localhost:3000"
