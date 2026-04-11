import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  CheckIcon,
  CreditCardIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react"
import { useState } from "react"

import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui/card"
import { Separator } from "ui/separator"

import UsageStats from "@/components/user/subscription/usage-stats"

export const Route = createFileRoute("/_user/dashboard/subscription")({
  component: SubscriptionPage,
})

function SubscriptionPage() {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  const { data: subscription } = useQuery({
    ...queryApi.user.getSubscription.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: plans, isLoading: isPlansLoading } = useQuery({
    ...queryApi.user.getSubscriptionPlans.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const checkoutMutation = useMutation({
    mutationFn: async (tier: "pro" | "enterprise") => {
      setIsCheckoutLoading(true)
      const result = await queryApi.user.createSubscriptionCheckout.call({
        tier,
      })
      return result
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error: Error) => {
      setIsCheckoutLoading(false)
      alert(`Failed to create checkout: ${error.message}`)
    },
  })

  const portalMutation = useMutation({
    mutationFn: async () => {
      setIsPortalLoading(true)
      const result = await queryApi.user.createBillingPortal.call()
      return result
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error: Error) => {
      setIsPortalLoading(false)
      alert(`Failed to open billing portal: ${error.message}`)
    },
  })

  const currentTier = subscription?.tier ?? "free"
  const isPaid = subscription?.isPaid ?? false
  const status = subscription?.status ?? "active"

  const formatPrice = (price: number | null) => {
    if (price === null) return "Free"
    return `$${price}/month`
  }

  const formatYearlyPrice = (price: number | null) => {
    if (price === null) return null
    return `$${price}/year`
  }

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription plan and billing.
        </p>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {isPaid && status === "active" && (
                  <Badge variant="default" className="bg-green-600">
                    Active
                  </Badge>
                )}
                {status === "cancelled" && (
                  <Badge variant="secondary">Cancelled</Badge>
                )}
                {status === "past_due" && (
                  <Badge variant="destructive">Payment Failed</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1.5">
                You are currently on the{" "}
                <strong className="capitalize">{currentTier}</strong> plan
              </CardDescription>
            </div>
            {isPaid && (
              <Button
                variant="outline"
                onClick={() => portalMutation.mutate()}
                disabled={isPortalLoading}
              >
                {isPortalLoading ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCardIcon className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <UsageStats
            limits={subscription?.limits}
            currentPeriodEnd={
              subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toISOString()
                : null
            }
            cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-semibold">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Upgrade or downgrade your plan at any time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {isPlansLoading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <Loader2Icon className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : (
          plans?.map((plan) => {
            const isCurrentPlan = plan.tier === currentTier
            const canUpgrade = !isCurrentPlan && plan.tier !== "free"

            return (
              <Card
                key={plan.tier}
                className={
                  isCurrentPlan ? "border-primary ring-primary ring-1" : ""
                }
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.tier === "free" ? (
                      <SparklesIcon className="text-muted-foreground h-5 w-5" />
                    ) : (
                      <CreditCardIcon className="text-primary h-5 w-5" />
                    )}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">
                      {formatPrice(plan.monthlyPrice)}
                    </div>
                    {plan.yearlyPrice && (
                      <div className="text-muted-foreground text-sm">
                        {formatYearlyPrice(plan.yearlyPrice)}{" "}
                        <span className="text-green-600">(save 17%)</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-green-600" />
                      {plan.limits.maxRequestsPerMonth ===
                      Number.POSITIVE_INFINITY
                        ? "Unlimited"
                        : plan.limits.maxRequestsPerMonth.toLocaleString()}{" "}
                      requests/month
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-green-600" />
                      {plan.limits.maxTokensPerRequest.toLocaleString()}{" "}
                      tokens/request
                    </li>
                    {plan.limits.maxCustomTools !== null && (
                      <li className="flex items-center gap-2 text-sm">
                        <CheckIcon className="h-4 w-4 text-green-600" />
                        {plan.limits.maxCustomTools} custom tools
                      </li>
                    )}
                    {plan.limits.maxCustomTools === null &&
                      plan.tier !== "free" && (
                        <li className="flex items-center gap-2 text-sm">
                          <CheckIcon className="h-4 w-4 text-green-600" />
                          Unlimited custom tools
                        </li>
                      )}
                  </ul>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Features:</div>
                    <ul className="space-y-1">
                      {plan.features.map((feature: string) => (
                        <li
                          key={feature}
                          className="text-muted-foreground flex items-center gap-2 text-xs"
                        >
                          <CheckIcon className="h-3 w-3 text-green-600" />
                          {feature.replace(/_/g, " ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled variant="secondary">
                      Current Plan
                    </Button>
                  ) : canUpgrade ? (
                    <Button
                      className="w-full"
                      onClick={() =>
                        checkoutMutation.mutate(
                          plan.tier as "pro" | "enterprise",
                        )
                      }
                      disabled={isCheckoutLoading}
                    >
                      {isCheckoutLoading ? (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Upgrade to {plan.name}
                    </Button>
                  ) : (
                    <Link to="/dashboard/subscription" className="w-full">
                      <Button className="w-full" variant="outline">
                        Downgrade
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Legacy Credits Link */}
      <Separator />
      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Looking for your credit balance?{" "}
          <Link
            to="/dashboard/credits"
            className="text-primary hover:underline"
          >
            View legacy credits page
          </Link>
        </p>
      </div>
    </div>
  )
}
