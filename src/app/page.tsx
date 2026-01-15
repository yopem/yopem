import CTA from "@/components/landing/cta"
import Features from "@/components/landing/features"
import Hero from "@/components/landing/hero"
import Pricing from "@/components/landing/pricing"
import Footer from "@/components/navigation/footer"
import Header from "@/components/navigation/header"

export default function HomePage() {
  return (
    <>
      <Header />
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
