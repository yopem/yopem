import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { queryApi } from "rpc/query"

import CreditStats from "@/components/user/credits/credit-stats"
import PurchaseCredits from "@/components/user/credits/purchase-credits"
import TransactionHistory from "@/components/user/credits/transaction-history"

export const Route = createFileRoute("/_user/dashboard/credits")({
  component: CreditsPage,
})

function CreditsPage() {
  const [customAmount, setCustomAmount] = useState("")
  const [amountError, setAmountError] = useState("")
  const { data: creditsData, isLoading } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: transactionsData } = useQuery({
    ...queryApi.user.getTransactions.queryOptions({ input: { limit: 20 } }),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: pendingCheckouts } = useQuery({
    ...queryApi.user.getPendingCheckouts.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const purchaseMutation = useMutation({
    mutationFn: (amount: number) => {
      const apiUrl = process.env["PUBLIC_API_URL"] ?? ""
      window.location.href = `${apiUrl}/checkout?amount=${amount}&successUrl=${encodeURIComponent(window.location.href)}`
      return Promise.resolve()
    },
  })

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setAmountError("")

    if (!value) return

    const amount = Number.parseFloat(value)
    if (Number.isNaN(amount)) {
      setAmountError("Please enter a valid number")
      return
    }

    if (amount < 1) {
      setAmountError("Minimum amount is $1")
      return
    }

    if (amount > 1000) {
      setAmountError("Maximum amount is $1000")
      return
    }
  }

  const handlePurchase = () => {
    const amount = Number.parseFloat(customAmount)
    if (Number.isNaN(amount) || amount < 1 || amount > 1000) {
      setAmountError("Please enter a valid amount between $1 and $1000")
      return
    }

    purchaseMutation.mutate(amount)
  }

  const calculateCredits = (amount: number) => {
    return Math.floor(amount * 10)
  }

  const balance = Number(creditsData?.balance ?? 0)
  const totalPurchased = Number(creditsData?.totalPurchased ?? 0)
  const totalUsed = Number(creditsData?.totalUsed ?? 0)

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Credits</h1>
        <p className="text-muted-foreground mt-2">
          Manage your credits and view transaction history.
        </p>
        <p className="mt-4 text-sm text-amber-600">
          We&apos;ve moved to a new subscription-based pricing model.{" "}
          <Link to="/dashboard/subscription" className="underline">
            Check out the new plans
          </Link>
        </p>
      </div>

      <CreditStats
        balance={balance}
        totalPurchased={totalPurchased}
        totalUsed={totalUsed}
      />

      <PurchaseCredits
        customAmount={customAmount}
        amountError={amountError}
        pendingCheckouts={pendingCheckouts}
        purchaseMutation={purchaseMutation}
        onAmountChange={handleCustomAmountChange}
        onPurchase={handlePurchase}
        calculateCredits={calculateCredits}
      />

      <TransactionHistory
        transactions={transactionsData}
        isLoading={isLoading}
      />
    </div>
  )
}
