"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { CreditCardIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function CreditsPage() {
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

  const { data: productsData } = useQuery({
    ...queryApi.user.getProducts.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  }) as {
    data:
      | {
          productId: string
          credits: number
          price: number
          currency: string
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
          status: string
          createdAt: Date | null
        }[]
      | undefined
  }

  const purchaseMutation = useMutation({
    mutationFn: (productId: string) => {
      window.location.href = `/checkout?productId=${productId}&successUrl=${encodeURIComponent(window.location.href)}`
      return Promise.resolve()
    },
  })

  const balance = Number(creditsData?.balance ?? 0)
  const totalPurchased = Number(creditsData?.totalPurchased ?? 0)
  const totalUsed = Number(creditsData?.totalUsed ?? 0)

  const handlePurchasePackage = (productId: string) => {
    purchaseMutation.mutate(productId)
  }

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
                <h3 className="mb-2 text-sm font-semibold text-yellow-900">
                  Pending Payments
                </h3>
                <p className="text-xs text-yellow-700">
                  You have{" "}
                  {
                    pendingCheckouts.filter((c) => c.status === "pending")
                      .length
                  }{" "}
                  pending checkout session(s). Complete your payment to receive
                  credits.
                </p>
              </div>
            )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {productsData?.map((pkg) => (
              <button
                key={pkg.productId}
                type="button"
                onClick={() => handlePurchasePackage(pkg.productId)}
                disabled={purchaseMutation.isPending}
                className="bg-card hover:bg-accent hover:text-accent-foreground flex flex-col items-center justify-center gap-2 rounded-lg border p-6 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-3xl font-bold">{pkg.credits}</span>
                <span className="text-muted-foreground text-sm font-medium">
                  ${pkg.price}
                </span>
              </button>
            ))}
          </div>
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
