import { cookies } from "next/headers"
import { decodeIdToken, type OAuth2Tokens } from "arctic"

import { googleOAuth } from "@/lib/auth/oauth"
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "@/lib/auth/session"
import { getExistingUser, insertUser } from "@/lib/db/service/user"
import { ObjectParser } from "@/lib/utils/object-parser"
import { globalGETRateLimit } from "@/lib/utils/rate-limit"

export async function GET(request: Request): Promise<Response> {
  const rateLimit = await globalGETRateLimit()

  if (!rateLimit) {
    return new Response("Too many requests", {
      status: 429,
    })
  }

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  const storedState = (await cookies()).get("google_oauth_state")?.value ?? null
  const codeVerifier =
    (await cookies()).get("google_code_verifier")?.value ?? null

  if (
    code === null ||
    state === null ||
    storedState === null ||
    codeVerifier === null
  ) {
    return new Response("Please restart the process.", {
      status: 400,
    })
  }

  if (state !== storedState) {
    return new Response("Please restart the process.", {
      status: 400,
    })
  }

  let tokens: OAuth2Tokens

  try {
    tokens = await googleOAuth.validateAuthorizationCode(code, codeVerifier)
  } catch {
    return new Response("Please restart the process.", {
      status: 400,
    })
  }

  const claims = decodeIdToken(tokens.idToken())
  const claimsParser = new ObjectParser(claims)

  const googleId = claimsParser.getString("sub")
  const name = claimsParser.getString("name")
  const picture = claimsParser.getString("picture")
  const email = claimsParser.getString("email")

  const existingUser = await getExistingUser(googleId)

  if (existingUser) {
    const sessionToken = generateSessionToken()
    const session = await createSession(sessionToken, existingUser.userId)

    await setSessionTokenCookie(sessionToken, session.expiresAt)
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    })
  }

  const user = await insertUser({
    email: email,
    name: name,
    image: picture,
    providerAccountId: googleId,
  })

  const sessionToken = generateSessionToken()
  const session = await createSession(sessionToken, user.id)

  await setSessionTokenCookie(sessionToken, session.expiresAt)

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  })
}
