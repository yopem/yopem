import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_public/marketplace")({
  component: MarketplaceLayout,
  head: () => ({
    meta: [
      { title: "Browse Tools | Marketplace" },
      {
        name: "description",
        content: "Explore and use AI-powered tools to automate your workflows",
      },
    ],
  }),
})

function MarketplaceLayout() {
  return (
    <div className="bg-muted/30">
      <Outlet />
    </div>
  )
}
