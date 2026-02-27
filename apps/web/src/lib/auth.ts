import { authClient } from "@repo/auth/client"
import { subjects } from "@repo/auth/subjects"
import { logger } from "@repo/logger"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

const getServerUtils = async () => {
  const { getCookie, setCookie, deleteCookie, getRequestHeaders } =
    await import("@tanstack/react-start/server")
  return { getCookie, setCookie, deleteCookie, getRequestHeaders }
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
      logger.error(`Error verifying token: ${JSON.stringify(verified.err)}`)
      return false
    }

    if (verified.tokens) {
      const options = {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        maxAge: 34560000,
      }
      setCookie("access_token", verified.tokens.access, options)
      setCookie("refresh_token", verified.tokens.refresh, options)
    }

    return verified.subject.properties
  },
)

export const loginFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getCookie, setCookie, getRequestHeaders } = await getServerUtils()

  const accessToken = getCookie("access_token")
  const refreshToken = getCookie("refresh_token")

  if (accessToken) {
    const verified = await authClient.verify(subjects, accessToken, {
      refresh: refreshToken,
    })
    if (!verified.err && verified.tokens) {
      const options = {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        maxAge: 34560000,
      }
      setCookie("access_token", verified.tokens.access, options)
      setCookie("refresh_token", verified.tokens.refresh, options)
      throw redirect({ to: "/" })
    }
  }

  const headers = getRequestHeaders()
  const host = headers.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const origin = `${protocol}://${host}`

  setCookie("login_origin", origin, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  })

  const apiUrl = process.env["PUBLIC_API_URL"] ?? "http://localhost:4000"
  const { url } = await authClient.authorize(`${apiUrl}/auth/callback`, "code")
  throw redirect({ href: url })
})

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { deleteCookie } = await getServerUtils()

  deleteCookie("access_token")
  deleteCookie("refresh_token")
  throw redirect({ to: "/" })
})
