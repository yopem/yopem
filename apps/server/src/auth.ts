import type { Context, MiddlewareHandler } from "hono"

import { getCookie, setCookie } from "hono/cookie"

import { authClient } from "auth/client"
import { subjects } from "auth/subjects"
import type { SessionUser } from "auth/types"

export type { SessionUser }

interface SessionEnv {
  Variables: {
    session: SessionUser | null
  }
}

const isProduction = () => process.env["APP_ENV"] === "production"
const isSecure = () => {
  const cookieDomain = process.env["COOKIE_DOMAIN"]
  return !!cookieDomain || isProduction()
}

const getCookieOptions = () => {
  const cookieDomain = process.env["COOKIE_DOMAIN"]
  const prod = isProduction()
  return {
    sameSite: (prod ? "none" : "lax") as "none" | "lax",
    secure: isSecure(),
    httpOnly: true,
    path: "/",
    maxAge: 34560000,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  }
}

const setTokenCookies = (c: Context, access: string, refresh: string) => {
  const options = getCookieOptions()
  setCookie(c, "access_token", access, options)
  setCookie(c, "refresh_token", refresh, options)
}

export const authMiddleware: MiddlewareHandler<SessionEnv> = async (
  c,
  next,
) => {
  const accessToken = getCookie(c, "access_token")
  const refreshToken = getCookie(c, "refresh_token")

  console.info(
    `Auth middleware: access_token=${accessToken ? "present" : "missing"}, refresh_token=${refreshToken ? "present" : "missing"}`,
  )

  if (!accessToken) {
    c.set("session", null)
    return next()
  }

  let session: SessionUser | null = null
  try {
    const verified = await authClient.verify(subjects, accessToken, {
      refresh: refreshToken,
    })

    if (verified.err) {
      console.error(
        `Token verification failed: ${JSON.stringify(verified.err)}`,
      )
    } else {
      if (verified.tokens) {
        setTokenCookies(c, verified.tokens.access, verified.tokens.refresh)
      }
      session = verified.subject.properties
    }
  } catch (err) {
    console.error(
      `Auth middleware error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
    )
  }

  c.set("session", session)
  return next()
}

export { authClient, setTokenCookies, subjects }
