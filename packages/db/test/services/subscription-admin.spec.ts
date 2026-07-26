import { beforeEach, describe, expect, test, vi } from "vitest"

import {
  getRevenueStats,
  getSubscriptionStats,
  getSubscriptionsList,
} from "db/services/subscription-admin"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("subscription-admin service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("getSubscriptionStats returns counts", async () => {
    mockDb.setReturn(Array.from({ length: 11 }, () => [{ count: 1 }]))
    const result = await getSubscriptionStats()
    expect(result.totalSubscriptions).toBe(1)
    expect(result.activeSubscriptions).toBe(1)
    expect(result.proTierCount).toBe(1)
  })

  test("getSubscriptionsList returns subscriptions", async () => {
    mockDb.setReturn([
      [{ id: "s1", userId: "u1", tier: "free", status: "active" }],
    ])
    const result = await getSubscriptionsList({ limit: 10 })
    expect(result.subscriptions).toHaveLength(1)
  })

  test("getRevenueStats calculates revenue", async () => {
    mockDb.setReturn([[{ count: 2 }], [{ count: 1 }]])
    const result = await getRevenueStats()
    expect(result.proSubscribers).toBe(2)
    expect(result.enterpriseSubscribers).toBe(1)
    expect(result.estimatedMonthlyRevenue).toBe(2 * 19 + 1 * 99)
  })
})
