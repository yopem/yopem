"use client"

import { clientApi } from "@repo/orpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { useState } from "react"

import LoginButton from "@/components/auth/login-button"
import ToolRatingInput from "@/components/marketplace/tool-rating-input"
import ToolReviewsList from "@/components/marketplace/tool-reviews-list"

interface Review {
  id: string
  rating: number
  reviewText: string | null
  createdAt: Date | null
  userId: string
  userName: string | null
}

interface ToolReviewsSectionProps {
  slug: string
  reviews: Review[]
  isAuthenticated: boolean
}

const ToolReviewsSection = ({
  slug,
  reviews: initialReviews,
  isAuthenticated,
}: ToolReviewsSectionProps) => {
  const [reviews, setReviews] = useState(initialReviews)

  const handleReviewSubmit = async () => {
    try {
      const data = await clientApi.tools.getReviews({ slug })
      setReviews(data.reviews)
    } catch {
      // Silently fail - user can refresh to see new review
    }
  }

  return (
    <Card className="bg-card rounded-2xl border shadow-sm">
      <CardHeader className="border-border/50 border-b px-6 pt-6 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {isAuthenticated ? (
          <div className="bg-muted/30 border-border/50 rounded-xl border p-5">
            <h3 className="mb-4 text-sm font-medium">Write a review</h3>
            <ToolRatingInput slug={slug} onSuccess={handleReviewSubmit} />
          </div>
        ) : (
          <div className="bg-muted/30 border-border/50 flex flex-col items-center justify-center rounded-xl border py-8 text-center">
            <p className="text-muted-foreground mb-4 text-sm">
              Please log in to leave a review for this tool.
            </p>
            <LoginButton />
          </div>
        )}

        <div className="pt-2">
          <ToolReviewsList reviews={reviews} />
        </div>
      </CardContent>
    </Card>
  )
}

export default ToolReviewsSection
