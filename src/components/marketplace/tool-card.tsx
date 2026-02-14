import { ArrowRight as ArrowRightIcon, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

import Link from "@/components/link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface ToolCardProps {
  slug: string
  name: string
  description: string | null
  costPerRun: string | null
  categories?: { id: string; name: string; slug: string }[]
  thumbnail?: { id: string; url: string } | null
}

const ToolCard = ({
  slug,
  name,
  description,
  costPerRun,
  categories = [],
  thumbnail,
}: ToolCardProps) => {
  const isFree = Number(costPerRun ?? 0) === 0

  return (
    <Link href={`/marketplace/tools/${slug}`} className="group block">
      <Card className="border-border bg-card hover:border-foreground/20 hover:bg-accent/50 flex h-full cursor-pointer flex-col transition-colors duration-200">
        {thumbnail ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
            <Image
              src={thumbnail.url}
              alt={`${name} thumbnail`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-t-lg">
            <ImageIcon className="text-muted-foreground size-12" />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg font-semibold">
              {name}
            </CardTitle>
            <ArrowRightIcon className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {categories.slice(0, 2).map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {category.name}
                </Badge>
              ))}
              {categories.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{categories.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {description ?? "No description available"}
          </p>
        </CardContent>

        <CardFooter className="border-border/50 border-t pt-3">
          <div className="flex w-full items-center justify-between">
            <span
              className={`text-xs font-medium ${isFree ? "text-foreground" : "text-muted-foreground"}`}
            >
              {isFree ? "Free" : `${costPerRun} credits/run`}
            </span>
            <span className="text-primary text-xs font-medium transition-colors duration-200">
              View Details
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

export default ToolCard
