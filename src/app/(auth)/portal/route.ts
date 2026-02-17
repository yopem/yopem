import { CustomerPortal } from "@polar-sh/nextjs"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

import { auth } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { userSettingsTable } from "@/lib/db/schema"
import { siteDomain } from "@/lib/env/client"
import { appEnv, polarAccessToken } from "@/lib/env/server"

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
