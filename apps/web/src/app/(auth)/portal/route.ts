import { CustomerPortal } from "@polar-sh/nextjs"
import { auth } from "@repo/auth/session"
import { db } from "@repo/db"
import { userSettingsTable } from "@repo/db/schema"
import { siteDomain } from "@repo/env/client"
import { appEnv, polarAccessToken } from "@repo/env/server"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

export const GET = CustomerPortal({
  accessToken: polarAccessToken,
  getCustomerId: async (_req: NextRequest) => {
    const session = await auth()
    if (!session) {
      throw new Error("Unauthorized")
    }

    const userSettings = await db.query.userSettingsTable.findFirst({
      where: eq(userSettingsTable.userId, session.id),
    })

    if (!userSettings?.polarCustomerId) {
      throw new Error("No Polar customer ID found")
    }

    return userSettings.polarCustomerId
  },
  returnUrl: `https://${siteDomain}`,
  server: appEnv === "development" ? "sandbox" : "production",
})
