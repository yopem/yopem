"use client"

import { StarIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { clientApi } from "@/lib/orpc/client"
import { logger } from "@/lib/utils/logger"

interface ToolRatingInputProps {
  slug: string
  onSuccess?: () => void
}

const ToolRatingInput = ({ slug, onSuccess }: ToolRatingInputProps) => {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasUsedTool, setHasUsedTool] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadReviewData = async () => {
      let reviewData
      let usageData

      try {
        const [r, u] = await Promise.all([
          clientApi.tools.getUserReview({ slug }),
          clientApi.tools.hasUsedTool({ slug }),
        ])
        reviewData = r
        usageData = u
      } catch (error) {
        if (!cancelled) {
          logger.error(`Failed to load review data: ${String(error)}`)
        }
      }

      if (!cancelled && usageData) {
        setHasUsedTool(usageData.hasUsed)
      }

      if (!cancelled && reviewData) {
        setRating(reviewData.rating)
        setReviewText(reviewData.reviewText ?? "")
        setIsEditing(true)
      }

      if (!cancelled) {
        setIsLoading(false)
      }
    }

    void loadReviewData()
    return () => {
      cancelled = true
    }
  }, [slug])

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const reviewTextParam = reviewText.trim() || undefined
    const toastTitle = isEditing ? "Review updated" : "Review submitted"

    try {
      await clientApi.tools.submitReview({
        slug,
        rating,
        reviewText: reviewTextParam,
      })

      toastManager.add({
        title: toastTitle,
        description: "Thank you for your feedback!",
        type: "success",
      })

      setIsEditing(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
    }

    if (onSuccess) {
      onSuccess()
    }
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (hasUsedTool === false) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">
          You need to use this tool before you can review it
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Your Rating</label>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1
            const isFilled = starValue <= (hoverRating || rating)
            return (
              <button
                key={i}
                type="button"
                className="transition-colors hover:scale-110"
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(starValue)}
              >
                <StarIcon
                  className={`size-6 ${
                    isFilled
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Review (optional)</label>
        <Textarea
          className="mt-2"
          placeholder="Share your experience with this tool..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          {reviewText.length}/2000 characters
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full"
      >
        {isSubmitting
          ? "Submitting..."
          : isEditing
            ? "Update Review"
            : "Submit Review"}
      </Button>
    </div>
  )
}

export default ToolRatingInput
