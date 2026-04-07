import { createFileRoute, redirect } from "@tanstack/react-router"

const isValidRedirectPath = (path: string): boolean => {
  if (!path.startsWith("/")) return false
  if (path.startsWith("//")) return false
  if (path.includes("://")) return false
  return true
}

export const Route = createFileRoute("/auth/token")({
  beforeLoad: ({ search }) => {
    const { redirect: rawRedirect } = search as { redirect: string }

    const redirectPath =
      rawRedirect && isValidRedirectPath(rawRedirect) ? rawRedirect : "/"
    throw redirect({ to: redirectPath as "/" })
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
