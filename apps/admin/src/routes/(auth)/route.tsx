import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/(auth)")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/" })
    }
  },
  component: AuthLayoutComponent,
})

function AuthLayoutComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
