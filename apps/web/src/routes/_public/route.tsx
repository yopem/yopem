import { Outlet, createFileRoute } from "@tanstack/react-router"

import Footer from "@/components/navigation/footer"
import Header from "@/components/navigation/header"
import { getSession } from "@/lib/auth"

export const Route = createFileRoute("/_public")({
  beforeLoad: async () => {
    const session = await getSession()
    return { session }
  },
  component: PublicLayout,
})

function PublicLayout() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex min-h-screen flex-col">
      <Header session={session} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
