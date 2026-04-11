interface SubscriptionLimits {
  maxRequestsPerMonth: number
  maxTokensPerRequest: number
  maxCustomTools: number | null
}

interface UsageStatsProps {
  limits?: SubscriptionLimits
  currentPeriodEnd: string | null
  cancelAtPeriodEnd?: boolean
}

const UsageStats = ({
  limits,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: UsageStatsProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const maxRequests = limits?.maxRequestsPerMonth ?? 50
  const isUnlimited = maxRequests === Number.POSITIVE_INFINITY

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Monthly Requests</p>
          <p className="text-2xl font-semibold">
            {isUnlimited ? "Unlimited" : maxRequests.toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Tokens per Request</p>
          <p className="text-2xl font-semibold">
            {(limits?.maxTokensPerRequest ?? 1000).toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Custom Tools</p>
          <p className="text-2xl font-semibold">
            {limits?.maxCustomTools === null
              ? "Unlimited"
              : (limits?.maxCustomTools ?? 0)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Period Ends</span>
          <span className="font-medium">{formatDate(currentPeriodEnd)}</span>
        </div>
        {cancelAtPeriodEnd && (
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            Your subscription will end on this date. You can resume it anytime
            before then.
          </div>
        )}
      </div>
    </div>
  )
}

export default UsageStats
