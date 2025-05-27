"use server"

import { logout } from "@/lib/auth/logout"

export async function handleLogOut() {
  return await logout()
}
