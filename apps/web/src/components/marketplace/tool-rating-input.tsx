"use client"

import { logger } from "@repo/logger"
import { clientApi } from "@repo/orpc/client"
import { Button } from "@repo/ui/button"
import { Textarea } from "@repo/ui/textarea"
import { toastManager } from "@repo/ui/toast"
import { StarIcon } from "lucide-react"
import { useEffect, useReducer } from "react"

interface ToolRatingInputProps {
  slug: string
  onSuccess?: () => void
}

interface RatingState {
  rating: number
  hoverRating: number
  reviewText: string
  isSubmitting: boolean
  error: string | null
  isEditing: boolean
  hasUsedTool: boolean | null
  isLoading: boolean
}

type RatingAction =
  | { type: "SET_HOVER_RATING"; payload: number }
  | { type: "SET_RATING"; payload: number }
  | { type: "SET_REVIEW_TEXT"; payload: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_ERROR"; payload: string }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "LOAD_SUCCESS"
      payload: {
        hasUsed: boolean
        rating: number
        reviewText: string
        isEditing: boolean
      }
    }
  | { type: "LOAD_NO_REVIEW"; payload: { hasUsed: boolean } }
  | { type: "LOAD_ERROR" }

const initialState: RatingState = {
  rating: 0,
  hoverRating: 0,
  reviewText: "",
  isSubmitting: false,
  error: null,
  isEditing: false,
  hasUsedTool: null,
  isLoading: true,
}

const ratingReducer = (
  state: RatingState,
  action: RatingAction,
): RatingState => {
  switch (action.type) {
    case "SET_HOVER_RATING":
      return { ...state, hoverRating: action.payload }
    case "SET_RATING":
      return { ...state, rating: action.payload }
    case "SET_REVIEW_TEXT":
      return { ...state, reviewText: action.payload }
    case "SUBMIT_START":
      return { ...state, isSubmitting: true, error: null }
    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false, error: action.payload }
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false, isEditing: true }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "LOAD_SUCCESS":
      return {
        ...state,
        isLoading: false,
        hasUsedTool: action.payload.hasUsed,
        rating: action.payload.rating,
        reviewText: action.payload.reviewText,
        isEditing: action.payload.isEditing,
      }
    case "LOAD_NO_REVIEW":
      return {
        ...state,
        isLoading: false,
        hasUsedTool: action.payload.hasUsed,
      }
    case "LOAD_ERROR":
      return { ...state, isLoading: false }
    default:
      return state
  }
}

const ToolRatingInput = ({ slug, onSuccess }: ToolRatingInputProps) => {
  const [
    {
      rating,
      hoverRating,
      reviewText,
      isSubmitting,
      error,
      isEditing,
      hasUsedTool,
      isLoading,
    },
    dispatch,
  ] = useReducer(ratingReducer, initialState)

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
      } catch (err) {
        if (!cancelled) {
          logger.error(`Failed to load review data: ${String(err)}`)
          dispatch({ type: "LOAD_ERROR" })
        }
        return
      }

      if (cancelled) return

      if (reviewData) {
        dispatch({
          type: "LOAD_SUCCESS",
          payload: {
            hasUsed: usageData?.hasUsed ?? false,
            rating: reviewData.rating,
            reviewText: reviewData.reviewText ?? "",
            isEditing: true,
          },
        })
      } else {
        dispatch({
          type: "LOAD_NO_REVIEW",
          payload: { hasUsed: usageData?.hasUsed ?? false },
        })
      }
    }

    void loadReviewData()
    return () => {
      cancelled = true
    }
  }, [slug])

  const handleSubmit = async () => {
    if (rating === 0) {
      dispatch({ type: "SET_ERROR", payload: "Please select a rating" })
      return
    }

    dispatch({ type: "SUBMIT_START" })

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

      dispatch({ type: "SUBMIT_SUCCESS" })
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: err instanceof Error ? err.message : "Failed to submit review",
      })
    }

    if (onSuccess) {
      onSuccess()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-5 w-32 animate-pulse rounded-sm" />
        <div className="bg-muted h-4 w-24 animate-pulse rounded-sm" />
        <div className="bg-muted h-7 w-40 animate-pulse rounded-sm" />
        <div className="bg-muted h-[120px] w-full animate-pulse rounded-lg" />
        <div className="bg-muted h-9 w-full animate-pulse rounded-lg" />
      </div>
    )
  }

  if (hasUsedTool === false) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-foreground text-sm font-medium">Use required</p>
        <p className="text-muted-foreground text-xs">
          Run this tool at least once before leaving a review.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-foreground text-base font-semibold">
        {isEditing ? "Edit your review" : "Write a review"}
      </h3>
      <div>
        <label
          htmlFor="rating"
          className="text-foreground mb-2 block text-sm font-medium"
        >
          Your Rating
        </label>
        <div id="rating" className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1
            const isFilled = starValue <= (hoverRating || rating)
            return (
              <button
                key={starValue}
                type="button"
                className="transition-transform hover:scale-110 focus:outline-none"
                onMouseEnter={() =>
                  dispatch({ type: "SET_HOVER_RATING", payload: starValue })
                }
                onMouseLeave={() =>
                  dispatch({ type: "SET_HOVER_RATING", payload: 0 })
                }
                onClick={() =>
                  dispatch({ type: "SET_RATING", payload: starValue })
                }
              >
                <StarIcon
                  className={`size-6 ${
                    isFilled
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30 dark:text-muted-foreground/20"
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-text"
          className="text-foreground mb-2 block text-sm font-medium"
        >
          Review (optional)
        </label>
        <Textarea
          id="review-text"
          className="min-h-[120px] resize-none"
          placeholder="Share your experience with this tool..."
          value={reviewText}
          onChange={(e) =>
            dispatch({ type: "SET_REVIEW_TEXT", payload: e.target.value })
          }
          maxLength={2000}
        />
        <div className="mt-1.5 flex justify-end">
          <p className="text-muted-foreground text-xs">
            {reviewText.length}/2000
          </p>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full"
        size="lg"
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
