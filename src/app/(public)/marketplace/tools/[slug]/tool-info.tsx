import { CalendarIcon, FolderIcon, TagIcon, CreditCardIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface ToolInfoProps {
  tool: {
    name: string
    description: string | null
    status: string
    costPerRun: string | null
    createdAt: Date | null
    categories: { id: string; name: string; slug: string }[]
    tags: { id: string; name: string; slug: string }[]
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

  return (
    <div className="space-y-4">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Tool Info</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                tool.status === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {tool.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Description</p>
            <p className="text-sm/relaxed">
              {tool.description ?? "No description available"}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CreditCardIcon className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Cost per run:</span>
              <span className="font-medium">
                {cost > 0 ? `${cost} credits` : "Free"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formattedDate}</span>
            </div>
          </div>

          {tool.categories.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <FolderIcon className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground">Categories</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tool.categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      className="text-xs"
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
              <Separator />
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <TagIcon className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tool.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ToolInfo
