import { Button } from "@repo/ui/button"
import { PencilIcon, StarIcon, XIcon } from "lucide-react"

import ToolRatingInput from "@/components/marketplace/tool-rating-input"

interface Review {
  id: string
  rating: number
  reviewText: string | null
  createdAt: Date | null
  userName: string | null
}

interface ToolReviewsListProps {
  reviews: Review[]
  currentUserName?: string | null
  isAuthenticated?: boolean
  hasExistingReview?: boolean
  editorOpen?: boolean
  onEditorOpen?: () => void
  onEditorClose?: () => void
  slug?: string
  onEditorSuccess?: () => void
}

const ToolReviewsList = ({
  reviews,
  currentUserName,
  isAuthenticated,
  hasExistingReview,
  editorOpen,
  onEditorOpen,
  onEditorClose,
  slug,
  onEditorSuccess,
}: ToolReviewsListProps) => {
  if (reviews.length === 0) {
    return (
      <div className="border-border bg-card rounded-lg border">
        <div
          className={`px-4 py-4 sm:px-5 ${editorOpen ? "border-border border-b" : "flex min-h-[160px] flex-col items-center justify-center py-10 text-center"}`}
        >
          {editorOpen ? (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                No reviews yet. Be the first to review this tool!
              </p>
              {onEditorClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground -mr-1 h-6 gap-1 px-2 text-xs"
                  onClick={onEditorClose}
                >
                  <XIcon className="size-3" />
                  Cancel
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                No reviews yet. Be the first to review this tool!
              </p>
              {isAuthenticated && !hasExistingReview && onEditorOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={onEditorOpen}
                >
                  <PencilIcon className="size-3.5" />
                  Write a review
                </Button>
              )}
            </>
          )}
        </div>

        {isAuthenticated && editorOpen && slug && (
          <div className="p-4 sm:p-5">
            <ToolRatingInput slug={slug} onSuccess={onEditorSuccess} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const isOwnReview =
          currentUserName != null && review.userName === currentUserName

        return (
          <div key={review.id}>
            <div
              className={`border-border bg-card rounded-lg border p-4 sm:p-5 ${isOwnReview && editorOpen ? "rounded-b-none border-b-0" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase">
                  {(review.userName ?? "A")[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-sm font-medium">
                        {review.userName ?? "Anonymous"}
                      </span>
                      {isOwnReview && (
                        <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                          Your review
                        </span>
                      )}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`size-3.5 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/25"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {review.createdAt &&
                          new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                      </span>
                      {isOwnReview && onEditorOpen && !editorOpen && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground -mr-1 h-6 gap-1 px-2 text-xs"
                          onClick={onEditorOpen}
                        >
                          <PencilIcon className="size-3" />
                          Edit
                        </Button>
                      )}
                      {isOwnReview && editorOpen && onEditorClose && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground -mr-1 h-6 gap-1 px-2 text-xs"
                          onClick={onEditorClose}
                        >
                          <XIcon className="size-3" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  {review.reviewText && (
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {review.reviewText}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isOwnReview && editorOpen && slug && (
              <div className="border-border bg-card rounded-b-lg border border-t-0 p-4 sm:p-5">
                <ToolRatingInput slug={slug} onSuccess={onEditorSuccess} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ToolReviewsList
