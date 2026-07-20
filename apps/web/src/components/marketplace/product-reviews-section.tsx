"use client"

import { useState } from "react"

import { clientApi } from "rpc/client"

import LoginButton from "@/components/auth/login-button"
import ProductReviewsList from "@/components/marketplace/product-reviews-list"

interface Review {
  id: string
  rating: number
  reviewText: string | null
  createdAt: Date | null
  userName: string | null
}

interface ProductReviewsSectionProps {
  slug: string
  reviews: Review[]
  isAuthenticated: boolean
  currentUserName?: string | null
  hasUsedProduct?: boolean
}

const ProductReviewsSection = ({
  slug,
  reviews: initialReviews,
  isAuthenticated,
  currentUserName,
  hasUsedProduct,
}: ProductReviewsSectionProps) => {
  const [reviews, setReviews] = useState(initialReviews)
  const [editorOpen, setEditorOpen] = useState(false)

  const hasExistingReview =
    currentUserName != null &&
    reviews.some((r) => r.userName === currentUserName)

  const handleReviewSubmit = async () => {
    try {
      const data = await clientApi.products.getReviews({ slug })
      setReviews(data.reviews)
      setEditorOpen(false)
    } catch {
      // ignore error
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          Reviews
        </h2>
        <p className="text-muted-foreground text-sm">
          See what others are saying about this product.
        </p>
      </div>

      <ProductReviewsList
        reviews={reviews}
        currentUserName={currentUserName ?? null}
        isAuthenticated={isAuthenticated}
        editorOpen={editorOpen}
        onEditorOpen={() => setEditorOpen(true)}
        onEditorClose={() => setEditorOpen(false)}
        hasExistingReview={hasExistingReview}
        slug={slug}
        onEditorSuccess={handleReviewSubmit}
        hasUsedProduct={hasUsedProduct}
      />

      {!isAuthenticated && (
        <div className="border-border bg-muted/30 flex flex-col items-center justify-center rounded-lg border px-4 py-8 text-center sm:flex-row sm:gap-4 sm:py-5 sm:text-left">
          <p className="text-muted-foreground mb-4 text-sm sm:mb-0 sm:flex-1">
            Sign in to leave a review for this product.
          </p>
          <LoginButton />
        </div>
      )}
    </div>
  )
}

export default ProductReviewsSection
