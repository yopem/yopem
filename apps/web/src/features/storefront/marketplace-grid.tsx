import { PackageIcon } from "lucide-react"

import type { ProductCardProps } from "@/features/storefront/product-card"

import { ProductCard } from "@/features/storefront/product-card"

type Product = ProductCardProps["product"]

interface MarketplaceGridProps {
  products: Product[]
}

export function MarketplaceGrid({ products }: MarketplaceGridProps) {
  if (products.length === 0) {
    return (
      <div className="bg-card flex flex-col items-center justify-center rounded-3xl border border-dashed py-24 text-center">
        <div className="bg-muted/50 mb-6 rounded-full p-6">
          <PackageIcon className="text-muted-foreground size-12" />
        </div>
        <h3 className="mb-2 text-xl font-semibold tracking-tight">
          No products found
        </h3>
        <p className="text-muted-foreground max-w-sm text-base">
          Try adjusting your search terms or filter criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
