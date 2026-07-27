import { createServerFn } from "@tanstack/react-start"
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server"

import { authClient } from "auth/client"
import { subjects } from "auth/subjects"
import { adminOrigin, authCallbackUrl, cookieDomain, isProd } from "env"

const isSecure = () => {
  return !!cookieDomain || isProd
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
      const sameSite: "none" | "lax" = isProd ? "none" : "lax"
      const options = {
        httpOnly: true,
        sameSite,
        path: "/",
        maxAge: 86400,
        secure: isSecure(),
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      }
      setCookie("access_token", verified.tokens.access, options)
      setCookie("refresh_token", verified.tokens.refresh, {
        ...options,
        maxAge: 604800,
      })
    }

    return verified.subject.properties
  },
)

export const loginFn = createServerFn({ method: "POST" }).handler(async () => {
  const accessToken = getCookie("access_token")
  const refreshToken = getCookie("refresh_token")

  if (accessToken) {
    const verified = await authClient.verify(subjects, accessToken, {
      refresh: refreshToken,
    })
    if (!verified.err && verified.tokens) {
      const sameSite: "none" | "lax" = isProd ? "none" : "lax"
      const options = {
        httpOnly: true,
        sameSite,
        path: "/",
        maxAge: 86400,
        secure: isSecure(),
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      }
      setCookie("access_token", verified.tokens.access, options)
      setCookie("refresh_token", verified.tokens.refresh, {
        ...options,
        maxAge: 604800,
      })
      return { redirectTo: "/" }
    }
  }

  const origin = adminOrigin ?? "http://localhost:3001"

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
  return { redirectTo: "/auth/login" }
})
