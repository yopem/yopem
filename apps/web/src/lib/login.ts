import { loginFn } from "@/lib/auth"

export async function loginAndRedirect(returnTo: string): Promise<void> {
  const res = await loginFn({ data: { returnTo } })
  if (res.redirectTo) {
    window.location.href = res.redirectTo
  }
}
