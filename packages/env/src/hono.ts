import z from "zod"

import { honoServerSchema } from "./schema"

const schema = z.object(honoServerSchema)

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors
  const missing = Object.entries(formatted)
    .map(([key, errors]) => `  ${key}: ${errors?.join(", ")}`)
    .join("\n")
  throw new Error(`[env] Missing or invalid environment variables:\n${missing}`)
}

export const honoEnv = parsed.data
