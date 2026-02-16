"use client"

import { useState } from "react"

import LoginButton from "@/components/auth/login-button"
import ToolRatingInput from "@/components/marketplace/tool-rating-input"
import ToolReviewsList from "@/components/marketplace/tool-reviews-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { clientApi } from "@/lib/orpc/client"

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
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated ? (
          <ToolRatingInput slug={slug} onSuccess={handleReviewSubmit} />
        ) : (
          <div className="py-4 text-center">
            <p className="text-muted-foreground mb-4">
              Please login to leave a review
            </p>
            <LoginButton />
          </div>
        )}

        <ToolReviewsList reviews={reviews} />
      </CardContent>
    </Card>
  )
}

export default ToolReviewsSection
