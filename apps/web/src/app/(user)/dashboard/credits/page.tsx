"use client"

import { queryApi } from "@repo/api/orpc/query"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"

import AutoTopupSettings from "@/components/user/credits/auto-topup-settings"
import CreditStats from "@/components/user/credits/credit-stats"
import PurchaseCredits from "@/components/user/credits/purchase-credits"
import TransactionHistory from "@/components/user/credits/transaction-history"

interface AutoTopupState {
  enabled: boolean
  threshold: string
  amount: string
}

export default function CreditsPage() {
  const [customAmount, setCustomAmount] = useState("")
  const [amountError, setAmountError] = useState("")
  const { data: creditsData, isLoading } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  }) as {
    data:
      | {
          id: string
          userId: string
          balance: string
          totalPurchased: string
          totalUsed: string
          createdAt: Date
          updatedAt: Date | null
        }
      | undefined
      | null
  } & { isLoading: boolean }

  const { data: autoTopupSettings } = useQuery({
    ...queryApi.user.getAutoTopupSettings.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  }) as {
    data:
      | {
          enabled: boolean
          threshold: number | null
          amount: number | null
        }
      | undefined
  }

  const { data: transactionsData } = useQuery({
    ...queryApi.user.getTransactions.queryOptions({ input: { limit: 20 } }),
    retry: false,
    refetchOnWindowFocus: false,
  }) as {
    data:
      | {
          id: string
          amount: string
          type: string
          description: string | null
          createdAt: Date | null
        }[]
      | undefined
  }

  const { data: pendingCheckouts } = useQuery({
    ...queryApi.user.getPendingCheckouts.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  }) as {
    data:
      | {
          id: string
          checkoutId: string
          productId: string
          checkoutUrl: string
          amount: string
          status: string
          createdAt: Date | null
        }[]
      | undefined
  }

  const [autoTopup, setAutoTopup] = useState<AutoTopupState>(() => ({
    enabled: autoTopupSettings?.enabled ?? false,
    threshold: autoTopupSettings?.threshold
      ? String(autoTopupSettings.threshold)
      : "",
    amount: autoTopupSettings?.amount ? String(autoTopupSettings.amount) : "",
  }))

  const updateAutoTopupMutation = useMutation({
    mutationFn: (settings: {
      enabled: boolean
      threshold?: number
      amount?: number
    }) => {
      return queryApi.user.updateAutoTopupSettings.call(settings)
    },
    onSuccess: () => {
      alert("Auto-topup settings updated successfully")
    },
    onError: (error: Error) => {
      alert(`Failed to update auto-topup settings: ${error.message}`)
    },
  })

  const purchaseMutation = useMutation({
    mutationFn: (amount: number) => {
      window.location.href = `/checkout?amount=${amount}&successUrl=${encodeURIComponent(window.location.href)}`
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

  const handleSaveAutoTopup = () => {
    if (autoTopup.enabled) {
      const threshold = Number.parseFloat(autoTopup.threshold)
      const amount = Number.parseFloat(autoTopup.amount)

      if (Number.isNaN(threshold) || Number.isNaN(amount)) {
        alert("Please enter valid numbers for threshold and amount")
        return
      }

      if (threshold < 1 || amount < 1) {
        alert("Threshold and amount must be at least $1")
        return
      }

      if (threshold >= amount) {
        alert("Threshold must be less than auto-topup amount")
        return
      }

      updateAutoTopupMutation.mutate({
        enabled: true,
        threshold,
        amount,
      })
    } else {
      updateAutoTopupMutation.mutate({
        enabled: false,
      })
    }
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

      <AutoTopupSettings
        autoTopup={autoTopup}
        updateMutation={updateAutoTopupMutation}
        onEnabledChange={(enabled) =>
          setAutoTopup((prev) => ({ ...prev, enabled }))
        }
        onThresholdChange={(value) =>
          setAutoTopup((prev) => ({ ...prev, threshold: value }))
        }
        onAmountChange={(value) =>
          setAutoTopup((prev) => ({ ...prev, amount: value }))
        }
        onSave={handleSaveAutoTopup}
        calculateCredits={calculateCredits}
      />

      <TransactionHistory
        transactions={transactionsData}
        isLoading={isLoading}
      />
    </div>
  )
}
