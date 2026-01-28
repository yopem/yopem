import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ToolCardProps {
  id: string
  name: string
  description: string | null
  costPerRun: string | null
  categoryId: string | null
}

function ToolCard({ id, name, description, costPerRun }: ToolCardProps) {
  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="line-clamp-1 text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {description ?? "No description available"}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {Number(costPerRun ?? 0) > 0 ? `${costPerRun} credits/run` : "Free"}
        </span>
        <Link href={`/marketplace/tools/${id}`}>
          <Button variant="ghost" size="sm">
            View <ArrowRightIcon className="ml-1 size-3" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default ToolCard
