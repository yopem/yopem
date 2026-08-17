// ponytail: duplicated from apps/admin/src/lib/auth.ts; promote to packages/auth if a third app needs it
import { createServerFn } from "@tanstack/react-start"
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server"

import { authClient } from "auth/client"
import { subjects } from "auth/subjects"
import { authCallbackUrl, cookieDomain, isProd, webOrigin } from "env"

const isSecure = () => !!cookieDomain || isProd

function setSessionCookies(access: string, refresh: string) {
  const sameSite: "none" | "lax" = isProd ? "none" : "lax"
  const options = {
    httpOnly: true,
    sameSite,
    path: "/",
    maxAge: 86400,
    secure: isSecure(),
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  }
  setCookie("access_token", access, options)
  setCookie("refresh_token", refresh, { ...options, maxAge: 604800 })
}

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const accessToken = getCookie("access_token")
    const refreshToken = getCookie("refresh_token")

    if (!accessToken) {
      return false
    }

    const verified = await authClient.verify(subjects, accessToken, {
      refresh: refreshToken,
    })

    if (verified.err) {
      console.error(`Error verifying token: ${JSON.stringify(verified.err)}`)
      return false
    }

    if (verified.tokens) {
      setSessionCookies(verified.tokens.access, verified.tokens.refresh)
    }

    return verified.subject.properties
  },
)

export const loginFn = createServerFn({ method: "POST" })
  .validator((data?: { returnTo?: string }) => data)
  .handler(async ({ data }) => {
    const accessToken = getCookie("access_token")
    const refreshToken = getCookie("refresh_token")

    if (accessToken) {
      const verified = await authClient.verify(subjects, accessToken, {
        refresh: refreshToken,
      })
      if (!verified.err && verified.tokens) {
        setSessionCookies(verified.tokens.access, verified.tokens.refresh)
        return { redirectTo: data?.returnTo ?? "/" }
      }
    }

    const baseOrigin = webOrigin ?? "http://localhost:3000"
    const origin = data?.returnTo
      ? `${baseOrigin}${data.returnTo.startsWith("/") ? data.returnTo : `/${data.returnTo}`}`
      : baseOrigin

    setCookie("login_origin", origin, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 300,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    })

    const callbackUrl = authCallbackUrl ?? "http://localhost:4000/auth/callback"
    const { url } = await authClient.authorize(callbackUrl, "code")
    return { redirectTo: url }
  })

export const logoutFn = createServerFn({ method: "POST" }).handler(() => {
  const cookieOpts = cookieDomain
    ? { path: "/", domain: cookieDomain }
    : { path: "/" }
  deleteCookie("access_token", cookieOpts)
  deleteCookie("refresh_token", cookieOpts)
  return { redirectTo: "/" }
})
