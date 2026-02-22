import { ORPCError, os } from "@orpc/server"
import { auth } from "@repo/auth/session"
import type { SessionUser } from "@repo/auth/types"
import { redisCache } from "@repo/cache"
import { db } from "@repo/db"
import { logger } from "@repo/logger"

export async function createRPCContext(opts: {
  headers: Headers
  request?: Request
  session?: SessionUser | null
}) {
  let session: SessionUser | null = null

  if (opts.session !== undefined) {
    session = opts.session ?? null
  } else if (opts.request) {
    const cookieHeader = opts.request.headers.get("cookie") ?? ""
    const cookies = new Map<string, { name: string; value: string }>()

    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=")
      if (name && value) {
        cookies.set(name.trim(), { name: name.trim(), value: value.trim() })
      }
    })

    const accessToken = cookies.get("access_token")
    const refreshToken = cookies.get("refresh_token")

    if (accessToken) {
      try {
        const { authClient } = await import("@repo/auth/client")
        const { subjects } = await import("@repo/auth/subjects")

        const verified = await authClient.verify(subjects, accessToken.value, {
          refresh: refreshToken?.value,
        })

        if (!verified.err) {
          session = verified.subject.properties as SessionUser
        }
      } catch (err) {
        logger.error(
          `[createRPCContext] token verification threw unexpectedly: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
        )
      }
    }
  } else {
    const authResult = await auth()
    session = authResult ? (authResult as SessionUser) : null
  }

  const redis = redisCache

  return {
    headers: opts.headers,
    session,
    db,
    redis,
  }
}

const o = os.$context<Awaited<ReturnType<typeof createRPCContext>>>()

const timingMiddleware = o.middleware(async ({ next, path }) => {
  const start = Date.now()

  try {
    return await next()
  } finally {
    logger.info(
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
      session: context.session as SessionUser,
    },
  })
})

export const adminProcedure = protectedProcedure.use(({ context, next }) => {
  if (context.session.role !== "admin") {
    throw new ORPCError("FORBIDDEN", {
      message: "This action requires admin privileges",
    })
  }

  return next()
})
