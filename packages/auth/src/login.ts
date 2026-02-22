"use server"
import { cookies as getCookies } from "next/headers"
import { redirect } from "next/navigation"

import { authClient } from "./client"
import { setTokens } from "./session"
import { subjects } from "./subjects"

export async function login() {
  const cookies = await getCookies()
  const accessToken = cookies.get("access_token")
  const refreshToken = cookies.get("refresh_token")

  if (accessToken) {
    const verified = await authClient.verify(subjects, accessToken.value, {
      refresh: refreshToken?.value,
    })
    if (!verified.err && verified.tokens) {
      await setTokens(verified.tokens.access, verified.tokens.refresh)
      redirect("/")
    }
  }

  const apiUrl = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000"
  const { url } = await authClient.authorize(`${apiUrl}/auth/callback`, "code")
  redirect(url)
}
