import { Outlet, createFileRoute } from "@tanstack/react-router"

const ProductsLayout = () => {
  return <Outlet />
}

export const Route = createFileRoute("/_dashboard/products")({
  component: ProductsLayout,
})
