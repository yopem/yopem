import type { MiddlewareHandler } from "hono"

import { HTTPException } from "hono/http-exception"

import type { AppContext } from "./context"

export const requireAuth: MiddlewareHandler<AppContext> = async (c, next) => {
  if (!c.var.session) {
    throw new HTTPException(401, { message: "Authentication required" })
  }

  await next()
}

export const requireAdmin: MiddlewareHandler<AppContext> = async (c, next) => {
  if (c.var.session?.role !== "admin") {
    throw new HTTPException(403, { message: "Admin privileges required" })
  }

  await next()
}
