import type { SessionUser } from "@repo/auth/types"

import { Polar } from "@polar-sh/sdk"
import { logger } from "@repo/logger"
import { Hono } from "hono"

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

  try {
    const result = await polar.customerSessions.create({
      customerId: session.id,
    })

    return c.redirect(result.customerPortalUrl, 303)
  } catch (error) {
    logger.error(
      `Portal error: ${error instanceof Error ? error.message : String(error)}`,
    )
    return c.text("Failed to create portal session", 500)
  }
})

export { portalRoute }
