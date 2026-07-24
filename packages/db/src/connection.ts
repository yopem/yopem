import { databaseUrl } from "env"

export const dbConnectionString = () => {
  const url = databaseUrl

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  return url
}
