import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Tools | Marketplace",
  description: "Explore and use AI-powered tools to automate your workflows",
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
