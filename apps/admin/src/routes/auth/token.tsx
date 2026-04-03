import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/auth/token")({
  beforeLoad: async ({ search }) => {
    const {
      access,
      refresh,
      redirect: redirectPath,
    } = search as {
      access: string
      refresh: string
      redirect: string
    }

    if (!access || !refresh) {
      throw redirect({ to: "/auth/login" })
    }

    const { setCookie } = await import("@tanstack/react-start/server")

    const cookieDomain = process.env["COOKIE_DOMAIN"]
    const options = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: false,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    }

    setCookie("access_token", access, { ...options, maxAge: 86400 })
    setCookie("refresh_token", refresh, { ...options, maxAge: 604800 })

    throw redirect({ to: (redirectPath || "/") as "/" })
  },
  component: TokenExchangePage,
})

function TokenExchangePage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Logging you in...</p>
    </div>
  )
}
