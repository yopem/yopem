export type SubscriptionTier = "free" | "pro" | "enterprise"

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "expired"

export type SubscriptionSource = "polar" | "grandfathered"

export interface PlanConfig {
  tier: SubscriptionTier
  displayName: string
  description: string
  monthlyPrice: number | null
  yearlyPrice: number | null
  limits: {
    maxRequestsPerMonth: number
    maxTokensPerRequest: number
    maxCustomTools: number | null
  }
  features: string[]
}

const plans: Record<SubscriptionTier, PlanConfig> = {
  free: {
    tier: "free",
    displayName: "Free",
    description: "Get started with essential tools",
    monthlyPrice: null,
    yearlyPrice: null,
    limits: {
      maxRequestsPerMonth: 50,
      maxTokensPerRequest: 1000,
      maxCustomTools: 0,
    },
    features: ["access_public_tools", "community_support"],
  },
  pro: {
    tier: "pro",
    displayName: "Pro",
    description: "For power users and creators",
    monthlyPrice: 19,
    yearlyPrice: 190,
    limits: {
      maxRequestsPerMonth: 1000,
      maxTokensPerRequest: 5000,
      maxCustomTools: 10,
    },
    features: [
      "access_public_tools",
      "create_custom_tools",
      "priority_support",
      "higher_token_limits",
    ],
  },
  enterprise: {
    tier: "enterprise",
    displayName: "Enterprise",
    description: "For teams with advanced needs",
    monthlyPrice: 99,
    yearlyPrice: 990,
    limits: {
      maxRequestsPerMonth: Number.POSITIVE_INFINITY,
      maxTokensPerRequest: 10000,
      maxCustomTools: null,
    },
    features: [
      "access_public_tools",
      "create_custom_tools",
      "priority_support",
      "higher_token_limits",
      "team_collaboration",
      "dedicated_support",
    ],
  },
}

export const getPlanConfig = (tier: SubscriptionTier): PlanConfig => {
  return plans[tier]
}

export const listPlans = (): PlanConfig[] => {
  return Object.values(plans)
}

export const hasFeature = (
  tier: SubscriptionTier,
  feature: string,
): boolean => {
  return plans[tier].features.includes(feature)
}

export const getTierLimits = (tier: SubscriptionTier): PlanConfig["limits"] => {
  return plans[tier].limits
}

export const isPaidTier = (tier: SubscriptionTier): boolean => {
  return tier !== "free"
}

export const getUpgradeTiers = (
  currentTier: SubscriptionTier,
): SubscriptionTier[] => {
  const allTiers: SubscriptionTier[] = ["free", "pro", "enterprise"]
  const currentIndex = allTiers.indexOf(currentTier)
  return allTiers.slice(currentIndex + 1)
}
