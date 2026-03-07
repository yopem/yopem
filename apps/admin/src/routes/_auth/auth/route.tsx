import { redirect, createFileRoute } from "@tanstack/react-router"

import LoginButton from "@/components/auth/login-button"
import { getSession } from "@/lib/auth"

export const Route = createFileRoute("/_auth/auth")({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: "/" })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold">Admin Console</h1>
        </div>
        <p className="p-5 text-center">Use your Google account to log in</p>
        <div className="flex items-center justify-center">
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
