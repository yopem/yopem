"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CreditCard as CreditCardIcon,
  Plus as PlusIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

const creditPackages = [
  { amount: 100, price: 10 },
  { amount: 500, price: 40 },
  { amount: 1000, price: 75 },
  { amount: 5000, price: 350 },
]

export default function CreditsPage() {
  const [customAmount, setCustomAmount] = useState("")

  const { data: creditsData, isLoading } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
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

  const purchaseMutation = useMutation({
    mutationFn: async (amount: number) => {
      await queryApi.user.addCredits.call({ amount })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Credits purchased",
        description: "Your credits have been added successfully.",
        type: "success",
      })
      setCustomAmount("")
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Error purchasing credits",
        description: err.message,
        type: "error",
      })
    },
  })

  const balance = Number(creditsData?.balance ?? 0)
  const totalPurchased = Number(creditsData?.totalPurchased ?? 0)
  const totalUsed = Number(creditsData?.totalUsed ?? 0)

  return (
    <div className="space-y-8">
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
            <CreditCardIcon className="text-muted-foreground h-4 w-4" />
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
            <TrendingUpIcon className="text-muted-foreground h-4 w-4" />
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
            <TrendingDownIcon className="text-muted-foreground h-4 w-4" />
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
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {creditPackages.map((pkg) => (
              <Button
                key={pkg.amount}
                variant="outline"
                className="h-auto flex-col py-4"
                onClick={() => purchaseMutation.mutate(pkg.amount)}
                disabled={purchaseMutation.isPending}
              >
                <span className="text-2xl font-bold">{pkg.amount}</span>
                <span className="text-muted-foreground text-sm">
                  ${pkg.price}
                </span>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min={1}
              />
            </div>
            <Button
              onClick={() => purchaseMutation.mutate(Number(customAmount))}
              disabled={
                purchaseMutation.isPending ||
                !customAmount ||
                Number(customAmount) < 1
              }
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Purchase
            </Button>
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
                    <TableCell>
                      <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="bg-muted h-4 w-48 animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="bg-muted ml-auto h-4 w-16 animate-pulse rounded" />
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
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleDateString()
                        : "-"}
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
