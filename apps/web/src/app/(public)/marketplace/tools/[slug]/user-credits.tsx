"use client"

import { queryApi } from "@repo/api/orpc/query"
import { Button } from "@repo/ui/button"
import { Card, CardContent } from "@repo/ui/card"
import { useQuery } from "@tanstack/react-query"
import { CreditCardIcon, PlusIcon } from "lucide-react"

export default function UserCredits() {
  const { data: creditsData } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
  }) as {
    data: { balance: string } | undefined | null
  }

  if (!creditsData) return null

  const balance = Number(creditsData.balance ?? 0)

  return (
    <Card className="bg-card rounded-2xl border shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <CreditCardIcon className="text-primary size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Your balance
              </p>
              <p className="text-foreground text-xl font-bold tracking-tight">
                {balance} credits
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-10 w-full rounded-xl"
          >
            <PlusIcon className="mr-1.5 size-4" />
            Add credits
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
