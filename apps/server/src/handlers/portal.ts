import { Hono } from "hono"
import { createCustomerPortalSession } from "server/payments/subscription-checkout"

import type { SessionUser } from "auth/types"
import { getUserSettings } from "db/services/user"

interface Env {
  Variables: {
    session: SessionUser | null
  }
}

const portalRoute = new Hono<Env>()

portalRoute.get("/", async (c) => {
  const session = c.get("session")

  if (!session) {
    return c.text("Unauthorized", 401)
  }

  try {
    const settings = await getUserSettings(session.id)
    if (!settings?.polarCustomerId) {
      return c.text("No customer ID found", 400)
    }

    const url = await createCustomerPortalSession(settings.polarCustomerId)
    return c.redirect(url, 303)
  } catch (error) {
    console.error(
      `Portal error: ${error instanceof Error ? error.message : String(error)}`,
    )
    return c.text("Failed to create portal session", 500)
  }
})

export { portalRoute }
