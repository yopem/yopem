import { Polar } from "@polar-sh/sdk"
import { Result, TaggedError } from "better-result"
import { Hono } from "hono"

import type { SessionUser } from "auth/types"
import { logger } from "logger"

export class PortalSessionError extends TaggedError("PortalSessionError")<{
  message: string
  cause?: unknown
}>() {}

interface Env {
  Variables: {
    session: SessionUser | null
  }
}

const appEnv = process.env["APP_ENV"] ?? "development"
const polarAccessToken = process.env["POLAR_ACCESS_TOKEN"] ?? ""

const polar = new Polar({
  accessToken: polarAccessToken,
  server: appEnv === "development" ? "sandbox" : "production",
})

const portalRoute = new Hono<Env>()

portalRoute.get("/", async (c) => {
  const session = c.get("session")

  if (!session) {
    return c.text("Unauthorized", 401)
  }

  const result = await Result.tryPromise({
    try: async () => {
      const polarResult = await polar.customerSessions.create({
        customerId: session.id,
      })
      return polarResult.customerPortalUrl
    },
    catch: (error) =>
      new PortalSessionError({
        message:
          error instanceof Error
            ? error.message
            : "Failed to create portal session",
        cause: error,
      }),
  })

  if (result.isOk()) {
    return c.redirect(result.value, 303)
  }

  logger.error(`Portal error: ${result.error.message}`)
  return c.text("Failed to create portal session", 500)
})

export { portalRoute }
