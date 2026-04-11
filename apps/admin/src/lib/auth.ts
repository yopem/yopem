import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { authClient } from "auth/client"
import { subjects } from "auth/subjects"
const getServerUtils = async () => {
  const { getCookie, setCookie, deleteCookie } =
    await import("@tanstack/react-start/server")
  return { getCookie, setCookie, deleteCookie }
}

const isProduction = () => process.env["APP_ENV"] === "production"
const isSecure = () => {
  const cookieDomain = process.env["COOKIE_DOMAIN"]
  return !!cookieDomain || isProduction()
}

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getCookie, setCookie } = await getServerUtils()

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
      const cookieDomain = process.env["COOKIE_DOMAIN"]
      const prod = isProduction()
      const options = {
        httpOnly: true,
        sameSite: (prod ? "none" : "lax") as "none" | "lax",
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
  const { getCookie, setCookie } = await getServerUtils()

  const accessToken = getCookie("access_token")
  const refreshToken = getCookie("refresh_token")

  if (accessToken) {
    const verified = await authClient.verify(subjects, accessToken, {
      refresh: refreshToken,
    })
    if (!verified.err && verified.tokens) {
      const cookieDomain = process.env["COOKIE_DOMAIN"]
      const prod = isProduction()
      const options = {
        httpOnly: true,
        sameSite: (prod ? "none" : "lax") as "none" | "lax",
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
      throw redirect({ to: "/" })
    }
  }

  const origin = process.env["ADMIN_ORIGIN"] ?? "http://localhost:3001"

  const cookieDomain = process.env["COOKIE_DOMAIN"]
  setCookie("login_origin", origin, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  })

  const callbackUrl =
    process.env["AUTH_CALLBACK_URL"] ?? "http://localhost:4000/auth/callback"
  const { url } = await authClient.authorize(callbackUrl, "code")
  throw redirect({ href: url })
})

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { deleteCookie } = await getServerUtils()

  const cookieDomain = process.env["COOKIE_DOMAIN"]
  const cookieOpts = cookieDomain
    ? { path: "/", domain: cookieDomain }
    : { path: "/" }
  deleteCookie("access_token", cookieOpts)
  deleteCookie("refresh_token", cookieOpts)
  throw redirect({ to: "/auth/login" })
})
