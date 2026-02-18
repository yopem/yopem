"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import {
  ClockIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  ZapIcon,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { queryApi } from "@/lib/orpc/query"
import { formatDateOnly } from "@/lib/utils/format-date"

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

  // Initialize state from query data only once on mount
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <CreditCardIcon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance.toLocaleString()} credits
            </div>
            <p className="text-muted-foreground text-xs">
              {totalPurchased > 0
                ? `${((totalUsed / totalPurchased) * 100).toFixed(1)}% used`
                : "No purchases yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchased
            </CardTitle>
            <TrendingUpIcon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPurchased.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Lifetime purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Used</CardTitle>
            <TrendingDownIcon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsed.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              Spent on tool executions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {pendingCheckouts &&
            pendingCheckouts.length > 0 &&
            pendingCheckouts.filter((c) => c.status === "pending").length >
              0 && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClockIcon className="size-4 text-yellow-700" />
                  <h3 className="text-sm font-semibold text-yellow-900">
                    Pending Payments
                  </h3>
                </div>
                <p className="mb-3 text-xs text-yellow-700">
                  You have{" "}
                  {
                    pendingCheckouts.filter((c) => c.status === "pending")
                      .length
                  }{" "}
                  pending checkout session(s). Complete your payment to receive
                  credits.
                </p>
                <div className="space-y-2">
                  {pendingCheckouts
                    .filter((c) => c.status === "pending")
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
                onChange={(e) => handleCustomAmountChange(e.target.value)}
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
              onClick={handlePurchase}
              disabled={
                purchaseMutation.isPending || !customAmount || !!amountError
              }
              className="w-full"
            >
              {purchaseMutation.isPending
                ? "Processing..."
                : "Purchase Credits"}
            </Button>

            <p className="text-muted-foreground text-center text-xs">
              Ratio: $10 = 100 credits
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ZapIcon className="size-5" />
            Auto Top-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-topup-enabled">Enable Auto Top-up</Label>
              <p className="text-muted-foreground text-sm">
                Automatically purchase credits when balance is low
              </p>
            </div>
            <Switch
              id="auto-topup-enabled"
              checked={autoTopup.enabled}
              onCheckedChange={(checked) =>
                setAutoTopup((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {autoTopup.enabled && (
            <>
              <div>
                <Label htmlFor="threshold">Threshold (credits)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="Trigger when balance falls below"
                  value={autoTopup.threshold}
                  onChange={(e) =>
                    setAutoTopup((prev) => ({
                      ...prev,
                      threshold: e.target.value,
                    }))
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="auto-amount">Top-up Amount (USD)</Label>
                <Input
                  id="auto-amount"
                  type="number"
                  min="1"
                  max="1000"
                  step="0.01"
                  placeholder="Amount to purchase"
                  value={autoTopup.amount}
                  onChange={(e) =>
                    setAutoTopup((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="mt-2"
                />
                {autoTopup.amount &&
                  !Number.isNaN(Number.parseFloat(autoTopup.amount)) && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Will purchase{" "}
                      {calculateCredits(Number.parseFloat(autoTopup.amount))}{" "}
                      credits
                    </p>
                  )}
              </div>

              <Button
                onClick={handleSaveAutoTopup}
                disabled={updateAutoTopupMutation.isPending}
                className="w-full"
              >
                {updateAutoTopupMutation.isPending
                  ? "Saving..."
                  : "Save Auto Top-up Settings"}
              </Button>
            </>
          )}

          {!autoTopup.enabled && (
            <Button
              onClick={handleSaveAutoTopup}
              disabled={updateAutoTopupMutation.isPending}
              variant="outline"
              className="w-full"
            >
              Save Settings
            </Button>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell className="text-muted-foreground">
                      Loading...
                    </TableCell>
                    <TableCell>
                      <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Loading
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      -
                    </TableCell>
                  </TableRow>
                ))
              ) : !transactionsData || transactionsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center">
                    <p className="text-muted-foreground">No transactions yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                transactionsData.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDateOnly(tx.createdAt) || "-"}
                    </TableCell>
                    <TableCell>{tx.description ?? "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tx.type === "purchase"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.type === "purchase" ? "Purchase" : "Usage"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === "purchase"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "purchase" ? "+" : "-"}
                      {Number(tx.amount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
