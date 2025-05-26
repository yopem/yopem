import { cookies } from "next/headers"
import { generateCodeVerifier, generateState } from "arctic"

import { googleOAuth } from "@/lib/auth/oauth"
import { appEnv } from "@/lib/utils/env/server"
import { globalGETRateLimit } from "@/lib/utils/rate-limit"

export async function GET(): Promise<Response> {
  const rateLimit = await globalGETRateLimit()

  if (!rateLimit) {
    return new Response("Too many requests", {
      status: 429,
    })
  }

  const cookiesData = await cookies()

  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  const url = googleOAuth.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ])

  cookiesData.set("google_oauth_state", state, {
    path: "/",
    secure: appEnv === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  })

  cookiesData.set("google_code_verifier", codeVerifier, {
    path: "/",
    secure: appEnv === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  })

  return Response.redirect(url)
}
