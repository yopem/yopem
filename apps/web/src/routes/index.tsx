import { createFileRoute } from "@tanstack/react-router"

import CTA from "@/components/landing/cta"
import Features from "@/components/landing/features"
import Hero from "@/components/landing/hero"
import Pricing from "@/components/landing/pricing"
import Footer from "@/components/navigation/footer"
import Header from "@/components/navigation/header"
import { getSession } from "@/lib/auth"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home" },
      {
        name: "description",
        content: "AI-powered tools to automate your workflows",
      },
    ],
  }),
  beforeLoad: async () => {
    const session = await getSession()
    return { session }
  },
  component: HomePage,
})

function HomePage() {
  const { session } = Route.useRouteContext()

  return (
    <>
      <Header session={session} />
      <main className="flex min-h-screen flex-col">
        <Hero />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
