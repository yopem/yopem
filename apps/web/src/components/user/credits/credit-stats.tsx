"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { CreditCardIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

interface CreditStatsProps {
  balance: number
  totalPurchased: number
  totalUsed: number
}

const CreditStats = ({
  balance,
  totalPurchased,
  totalUsed,
}: CreditStatsProps) => {
  return (
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
          <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
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
          <div className="text-2xl font-bold">{totalUsed.toLocaleString()}</div>
          <p className="text-muted-foreground text-xs">
            Spent on tool executions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreditStats
