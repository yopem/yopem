import { ORPCError, os } from "@orpc/server"

import { auth } from "@/lib/auth/session"
import { db } from "@/lib/db"

export async function createRPCContext(opts: { headers: Headers }) {
  const session = await auth()

  return {
    headers: opts.headers,
    session,
    db,
  }
}

const o = os.$context<Awaited<ReturnType<typeof createRPCContext>>>()

const timingMiddleware = o.middleware(async ({ next, path }) => {
  const start = Date.now()

  try {
    return await next()
  } finally {
    console.info(
      `[oRPC] ${String(path)} took ${Date.now() - start}ms to execute`,
    )
  }
})

export const publicProcedure = o.use(timingMiddleware)

export const protectedProcedure = publicProcedure.use(({ context, next }) => {
  if (!context.session || typeof context.session != "object") {
    throw new ORPCError("UNAUTHORIZED")
  }

  return next({
    context: {
      session: context.session,
    },
  })
})
