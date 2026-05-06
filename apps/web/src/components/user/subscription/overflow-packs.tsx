import { useMutation } from "@tanstack/react-query"
import { Loader2Icon, ZapIcon } from "lucide-react"
import { useState } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card"

interface OverflowPacksProps {
  overflowBalance: string
}

const PACKS = [
  { size: "100" as const, price: 10, label: "100 runs" },
  { size: "500" as const, price: 40, label: "500 runs" },
]

const OverflowPacks = ({ overflowBalance }: OverflowPacksProps) => {
  const [loadingPack, setLoadingPack] = useState<string | null>(null)

  const checkoutMutation = useMutation({
    mutationFn: async (packSize: "100" | "500") => {
      setLoadingPack(packSize)
      const result = await queryApi.user.createOverflowCreditCheckout.call({
        packSize,
      })
      return result
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error: Error) => {
      setLoadingPack(null)
      alert(`Failed to create checkout: ${error.message}`)
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Extra Runs</h2>
        <p className="text-muted-foreground mt-2">
          One-time run packs for when you exceed your monthly quota.
          {Number(overflowBalance) > 0 && (
            <>
              {" "}
              Current balance:{" "}
              <span className="text-foreground font-semibold">
                {overflowBalance} runs
              </span>
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PACKS.map((pack) => (
          <Card key={pack.size}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ZapIcon className="size-5 text-amber-500" />
                {pack.label}
              </CardTitle>
              <CardDescription>${pack.price} one-time purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => checkoutMutation.mutate(pack.size)}
                disabled={loadingPack !== null}
              >
                {loadingPack === pack.size ? (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                ) : (
                  <ZapIcon className="mr-2 size-4" />
                )}
                Purchase ${pack.price}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default OverflowPacks
