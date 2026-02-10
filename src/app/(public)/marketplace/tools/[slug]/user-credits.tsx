"use client"

import { useQuery } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"

export default function UserCredits() {
  const { data: creditsData } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
  }) as {
    data: { balance: string } | undefined | null
  }

  if (!creditsData) return null

  return (
    <div className="text-muted-foreground text-center text-sm">
      Your balance: {creditsData.balance ?? 0} credits
    </div>
  )
}
