import type { Context } from "hono"

import { deleteCookie, setCookie } from "hono/cookie"

import { cookieDomain, isProd } from "env"

export const ACCESS_TOKEN_MAX_AGE = 86400
export const REFRESH_TOKEN_MAX_AGE = 604800

const isSecure = !!cookieDomain || isProd

const sameSite: "none" | "lax" = isProd ? "none" : "lax"

export const sessionCookieOptions = {
  sameSite,
  secure: isSecure,
  httpOnly: true,
  path: "/",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
}

export function setSessionCookies(
  c: Context,
  access: string,
  refresh: string,
): void {
  setCookie(c, "access_token", access, {
    ...sessionCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  })
  setCookie(c, "refresh_token", refresh, {
    ...sessionCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })
}

export function clearLoginOriginCookie(c: Context): void {
  deleteCookie(c, "login_origin", {
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  })
}
