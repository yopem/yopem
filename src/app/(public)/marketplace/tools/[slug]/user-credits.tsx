"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCardIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { queryApi } from "@/lib/orpc/query"

export default function UserCredits() {
  const { data: creditsData } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
  }) as {
    data: { balance: string } | undefined | null
  }

  if (!creditsData) return null

  const balance = Number(creditsData.balance ?? 0)

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <CreditCardIcon className="text-primary size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Your Balance</p>
              <p className="text-xl font-bold">{balance} credits</p>
            </div>
          </div>
          <Button size="sm" variant="secondary">
            <PlusIcon className="mr-1 size-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
