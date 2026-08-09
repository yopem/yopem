import type { MiddlewareHandler } from "hono"
import type { AppContext } from "server/lib/context"

import { getCookie } from "hono/cookie"
import { setSessionCookies } from "server/lib/cookies"

import { authClient } from "auth/client"
import { subjects } from "auth/subjects"
import type { SessionUser } from "auth/types"

export type { SessionUser }

const tokenPresence = (token: string | undefined) =>
  token ? "present" : "missing"

export const authMiddleware: MiddlewareHandler<AppContext> = async (
  c,
  next,
) => {
  const accessToken = getCookie(c, "access_token")
  const refreshToken = getCookie(c, "refresh_token")

  console.info(
    `Auth middleware: access_token=${tokenPresence(accessToken)}, refresh_token=${tokenPresence(refreshToken)}`,
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
        setSessionCookies(c, verified.tokens.access, verified.tokens.refresh)
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
