import type { Metadata } from "next"

import { Skeleton } from "@repo/ui/skeleton"
import { Suspense } from "react"

import CTA from "@/components/landing/cta"
import Features from "@/components/landing/features"
import Hero from "@/components/landing/hero"
import Pricing from "@/components/landing/pricing"
import Footer from "@/components/navigation/footer"
import Header from "@/components/navigation/header"

export const metadata: Metadata = {
  title: "Home",
  description: "AI-powered tools to automate your workflows",
}

const HomePage = () => {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <Header />
      </Suspense>
      <main className="flex min-h-screen flex-col">
        <Hero />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <Footer />
      </Suspense>
    </>
  )
}

export default HomePage
