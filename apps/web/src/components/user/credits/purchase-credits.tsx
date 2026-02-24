"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { formatDateOnly } from "@repo/shared/format-date"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { ClockIcon, ExternalLinkIcon } from "lucide-react"

interface PendingCheckout {
  id: string
  checkoutId: string
  productId: string
  checkoutUrl: string
  amount: string
  status: string
  createdAt: Date | null
}

interface PurchaseCreditsProps {
  customAmount: string
  amountError: string
  pendingCheckouts: PendingCheckout[] | undefined
  purchaseMutation: UseMutationResult<void, Error, number, unknown>
  onAmountChange: (value: string) => void
  onPurchase: () => void
  calculateCredits: (amount: number) => number
}

const PurchaseCredits = ({
  customAmount,
  amountError,
  pendingCheckouts,
  purchaseMutation,
  onAmountChange,
  onPurchase,
  calculateCredits,
}: PurchaseCreditsProps) => {
  const pendingCount =
    pendingCheckouts?.filter((c) => c.status === "pending").length ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Credits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {pendingCount > 0 && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ClockIcon className="size-4 text-yellow-700" />
              <h3 className="text-sm font-semibold text-yellow-900">
                Pending Payments
              </h3>
            </div>
            <p className="mb-3 text-xs text-yellow-700">
              You have {pendingCount} pending checkout session(s). Complete your
              payment to receive credits.
            </p>
            <div className="space-y-2">
              {pendingCheckouts
                ?.filter((c) => c.status === "pending")
                .map((checkout) => (
                  <div
                    key={checkout.id}
                    className="bg-card text-card-foreground flex items-center justify-between rounded-md p-2 shadow-sm"
                  >
                    <div>
                      <p className="text-card-foreground text-sm font-medium">
                        ${Number(checkout.amount).toFixed(2)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateOnly(checkout.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(checkout.checkoutUrl, "_blank")
                      }
                      className="gap-1"
                    >
                      Pay Now
                      <ExternalLinkIcon className="size-3" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max="1000"
              step="0.01"
              placeholder="Enter amount (start from $5)"
              value={customAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="mt-2"
            />
            {amountError && (
              <p className="text-destructive mt-1 text-sm">{amountError}</p>
            )}
            {customAmount &&
              !amountError &&
              !Number.isNaN(Number.parseFloat(customAmount)) && (
                <p className="text-muted-foreground mt-2 text-sm">
                  ${Number.parseFloat(customAmount).toFixed(2)} ={" "}
                  {calculateCredits(Number.parseFloat(customAmount))} credits
                </p>
              )}
          </div>

          <Button
            onClick={onPurchase}
            disabled={
              purchaseMutation.isPending || !customAmount || !!amountError
            }
            className="w-full"
          >
            {purchaseMutation.isPending ? "Processing..." : "Purchase Credits"}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Ratio: $10 = 100 credits
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PurchaseCredits
