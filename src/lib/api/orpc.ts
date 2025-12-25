import { ORPCError, os } from "@orpc/server"

import { auth } from "@/lib/auth/session"
import { db } from "@/lib/db"

export async function createRPCContext(opts: {
  headers: Headers
  request?: Request
}) {
  const getCookiesFromRequest = () => {
    if (opts.request) {
      const cookieHeader = opts.request.headers.get("cookie") ?? ""
      const cookies = new Map()

      cookieHeader.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=")
        if (name && value) {
          cookies.set(name, { name: name.trim(), value: value.trim() })
        }
      })

      return {
        get: (name: string) => cookies.get(name) ?? null,
      }
    }
    return null
  }

  let session = null

  if (opts.request) {
    const requestCookies = getCookiesFromRequest()
    const accessToken = requestCookies?.get("access_token")
    const refreshToken = requestCookies?.get("refresh_token")

    if (accessToken) {
      const { authClient } = await import("@/lib/auth/client")
      const { subjects } = await import("@/lib/auth/subjects")

      const verified = await authClient.verify(subjects, accessToken.value, {
        refresh: refreshToken?.value,
      })

      if (!verified.err) {
        session = verified.subject.properties
      }
    }
  } else {
    session = await auth()
  }

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
