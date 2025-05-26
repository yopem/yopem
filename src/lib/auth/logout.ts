"use server"

import { redirect } from "next/navigation"

import { globalPOSTRateLimit } from "@/lib/utils/rate-limit"
import {
  deleteSessionTokenCookie,
  getCurrentSession,
  invalidateSession,
} from "./session"

export async function logout(): Promise<ActionResult> {
  const rateLimit = await globalPOSTRateLimit()

  if (!rateLimit) {
    return {
      message: "Too many requests",
    }
  }

  const { session } = await getCurrentSession()

  if (session === null) {
    return {
      message: "Not authenticated",
    }
  }

  await invalidateSession(session.id)
  void deleteSessionTokenCookie()

  return redirect("/auth/login")
}

interface ActionResult {
  message: string
}
