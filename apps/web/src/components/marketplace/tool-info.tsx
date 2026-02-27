import { Badge } from "@repo/ui/badge"
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
    <div className="border-border bg-card rounded-lg border p-5 shadow-sm">
      <h3 className="text-foreground mb-4 text-sm font-semibold tracking-tight">
        App Details
      </h3>

      <div className="space-y-4">
        {hasReviews && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rating</span>
            <div className="flex items-center gap-1.5">
              <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
              <span className="text-foreground font-medium">
                {tool.averageRating?.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({tool.reviewCount})
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground flex items-center gap-2">
            <CreditCardIcon className="size-4" />
            <span>Cost per run</span>
          </div>
          <span className="text-foreground font-medium">
            {cost > 0 ? `${cost} credits` : "Free"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="size-4" />
            <span>Added</span>
          </div>
          <span className="text-foreground font-medium">{formattedDate}</span>
        </div>

        {tool.categories.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground flex items-center gap-2">
              <FolderIcon className="size-4" />
              <span>Category</span>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {tool.categories.slice(0, 1).map((category) => (
                <span key={category.id} className="text-foreground font-medium">
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {tool.tags.length > 0 && (
        <div className="border-border/50 mt-5 space-y-3 border-t pt-5">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <TagIcon className="size-4" />
            <span>Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tool.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-md font-normal"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolInfo
