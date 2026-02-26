import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Separator } from "@repo/ui/separator"
import {
  CalendarIcon,
  FolderIcon,
  TagIcon,
  CreditCardIcon,
  StarIcon,
} from "lucide-react"

interface ToolInfoProps {
  tool: {
    name: string
    description: string | null
    status: string
    costPerRun: string | null
    createdAt: Date | null
    categories: { id: string; name: string; slug: string }[]
    tags: { id: string; name: string; slug: string }[]
    averageRating?: number | null
    reviewCount?: number
  }
}

const ToolInfo = ({ tool }: ToolInfoProps) => {
  const cost = Number(tool.costPerRun ?? 0)
  const formattedDate = tool.createdAt
    ? new Date(tool.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A"

  const hasReviews = tool.reviewCount && tool.reviewCount > 0

  return (
    <Card className="bg-card rounded-2xl border shadow-sm">
      <CardHeader className="border-border/50 border-b px-6 pt-6 pb-4">
        <CardTitle className="text-base font-semibold">
          About this tool
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {hasReviews && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                  key={i}
                  className={`size-4 ${
                    i < Math.round(tool.averageRating ?? 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted dark:text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-foreground font-semibold">
                {tool.averageRating?.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({tool.reviewCount}{" "}
                {tool.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground flex items-center gap-2.5">
              <CreditCardIcon className="size-4.5" />
              <span>Cost per run</span>
            </div>
            <span className="text-foreground font-medium">
              {cost > 0 ? `${cost} credits` : "Free"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground flex items-center gap-2.5">
              <CalendarIcon className="size-4.5" />
              <span>Added</span>
            </div>
            <span className="text-foreground font-medium">{formattedDate}</span>
          </div>
        </div>

        {tool.categories.length > 0 && (
          <>
            <Separator className="bg-border/60" />
            <div className="space-y-3">
              <div className="text-muted-foreground flex items-center gap-2.5 text-sm">
                <FolderIcon className="size-4.5" />
                <span className="text-foreground font-medium">Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tool.categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="bg-secondary/50 hover:bg-secondary/80 rounded-md px-2.5 py-1 text-xs font-medium"
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {tool.tags.length > 0 && (
          <>
            <Separator className="bg-border/60" />
            <div className="space-y-3">
              <div className="text-muted-foreground flex items-center gap-2.5 text-sm">
                <TagIcon className="size-4.5" />
                <span className="text-foreground font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="border-border/60 bg-card hover:bg-muted/50 rounded-md px-2.5 py-1 text-xs font-medium"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ToolInfo
