import { createFileRoute } from "@tanstack/react-router"

import { siteDescription, siteTitle } from "env"

import { SiteLayout } from "@/components/site-layout"
import { CTA } from "@/features/landing/cta"
import { Features } from "@/features/landing/features"
import { Hero } from "@/features/landing/hero"
import { getSiteUrl } from "@/lib/site-url"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteTitle || "Yopem"} - AI Tools & Automated Workflows` },
      {
        name: "description",
        content:
          siteDescription ||
          "Discover and run powerful AI tools for content generation, media processing, and automated workflows.",
      },
      { property: "og:title", content: siteTitle || "Yopem AI Tools" },
      {
        property: "og:description",
        content: siteDescription || "Discover and run powerful AI tools.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: getSiteUrl() },
    ],
    links: [{ rel: "canonical", href: getSiteUrl() }],
  }),
  component: LandingComponent,
})

function LandingComponent() {
  return (
    <SiteLayout>
      <Hero />
      <Features />
      <CTA />
    </SiteLayout>
  )
}
