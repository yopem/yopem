import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_public/marketplace")({
  component: MarketplaceLayout,
  head: () => ({
    meta: [
      { title: "Browse Products | Marketplace" },
      {
        name: "description",
        content:
          "Explore and use AI-powered products to automate your workflows",
      },
    ],
  }),
})

function MarketplaceLayout() {
  return (
    <div>
      <Outlet />
    </div>
  )
}
