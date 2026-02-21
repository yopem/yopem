import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { StarIcon } from "lucide-react"

interface Review {
  id: string
  rating: number
  reviewText: string | null
  createdAt: Date | null
  userId: string
  userName: string | null
}

interface ToolReviewsListProps {
  reviews: Review[]
}

const ToolReviewsList = ({ reviews }: ToolReviewsListProps) => {
  if (reviews.length === 0) {
    return null
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-4 last:border-0">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {review.userName ?? "Anonymous"}
                </span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`size-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-muted-foreground text-xs">
                {review.createdAt &&
                  new Date(review.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
              </span>
            </div>
            {review.reviewText && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {review.reviewText}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default ToolReviewsList
