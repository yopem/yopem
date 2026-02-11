import { Suspense } from "react"

import CTA from "@/components/landing/cta"
import Features from "@/components/landing/features"
import Hero from "@/components/landing/hero"
import Pricing from "@/components/landing/pricing"
import Footer from "@/components/navigation/footer"
import Header from "@/components/navigation/header"
import { ShimmerWrapper } from "@/components/ui/shimmer-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  return (
    <>
      <Suspense
        fallback={
          <ShimmerWrapper>
            <Skeleton className="h-16 w-full" />
          </ShimmerWrapper>
        }
      >
        <Header />
      </Suspense>
      <main className="flex min-h-screen flex-col">
        <Hero />
        <Features />
        <Pricing />
        <CTA />
      </main>
      <Suspense
        fallback={
          <ShimmerWrapper>
            <Skeleton className="h-32 w-full" />
          </ShimmerWrapper>
        }
      >
        <Footer />
      </Suspense>
    </>
  )
}
