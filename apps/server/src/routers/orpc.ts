import type { SessionUser } from "server/middleware/auth"

import { os as osBase, ORPCError } from "@orpc/server"

export const os = osBase.$context<{ session: SessionUser | null }>()

export const requireAuthMiddleware = os.middleware(({ context, next }) => {
  if (!context.session) {
    throw new ORPCError("UNAUTHORIZED", {
      status: 401,
      message: "Authentication required",
    })
  }
  return next({ context: { session: context.session } })
})

export const requireAdminMiddleware = os.middleware(({ context, next }) => {
  if (context.session?.role !== "admin") {
    throw new ORPCError("FORBIDDEN", {
      status: 403,
      message: "Admin access required",
    })
  }
  return next({ context: { session: context.session } })
})
