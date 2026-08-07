import { Link } from "@tanstack/react-router"
import { ArrowRightIcon, CoinsIcon, SparklesIcon } from "lucide-react"

import { Badge } from "ui/badge"
import { Card, CardFooter, CardHeader, CardPanel, CardTitle } from "ui/card"

export interface ProductCardProps {
  product: {
    id: string
    slug: string
    name: string
    excerpt?: string | null
    description?: string | null
    creditsPerRun?: number | null
    thumbnail?: { id: string; url: string } | null
    categories?: { id: string; name: string; slug: string }[]
  }
}

function stripHtml(html?: string | null): string {
  if (!html) return ""
  return html.replace(/<[^>]*>?/gm, "").trim()
}

export function ProductCard({ product }: ProductCardProps) {
  const rawDescription = stripHtml(product.description)
  const descriptionText =
    product.excerpt ??
    (rawDescription !== "" ? rawDescription : null) ??
    "Powerful AI workflow tool."

  return (
    <Card className="group border-border bg-card hover:border-foreground/20 relative flex flex-col justify-between overflow-hidden transition-colors">
      <div className="bg-muted/30 border-border/40 relative aspect-video w-full overflow-hidden border-b">
        {product.thumbnail?.url ? (
          <img
            src={product.thumbnail.url}
            alt={product.name}
            width={640}
            height={360}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-102"
            loading="lazy"
          />
        ) : (
          <div className="bg-muted/20 flex size-full items-center justify-center">
            <SparklesIcon className="text-muted-foreground/30 size-7" />
          </div>
        )}
        {product.categories && product.categories.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
            {product.categories.slice(0, 2).map((cat) => (
              <Badge
                key={cat.id}
                variant="outline"
                size="sm"
                className="bg-background/90 text-foreground border-border/40 text-[10px] font-medium shadow-2xs"
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="font-heading group-hover:text-foreground line-clamp-1 text-base font-semibold tracking-tight transition-colors">
          {product.name}
        </CardTitle>
      </CardHeader>

      <CardPanel className="flex-1 p-4 pt-0">
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {descriptionText}
        </p>
      </CardPanel>

      <CardFooter className="border-border/40 flex items-center justify-between border-t p-4 pt-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <CoinsIcon className="text-muted-foreground size-3.5" />
          <span>
            {product.creditsPerRun
              ? `${product.creditsPerRun} credits`
              : "Free"}
          </span>
        </div>

        <Link
          to="/products/$productSlug"
          params={{ productSlug: product.slug }}
          className="text-foreground hover:text-foreground/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
        >
          <span>Try Tool</span>
          <ArrowRightIcon className="size-3" />
        </Link>
      </CardFooter>
    </Card>
  )
}
