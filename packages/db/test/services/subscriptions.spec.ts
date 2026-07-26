import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

import {
  cancelSubscription,
  createSubscription,
  expireSubscription,
  getOrCreateSubscription,
  getSubscription,
  getSubscriptionsByStatus,
  updateSubscription,
  updateSubscriptionByPolarId,
} from "db/services/subscriptions"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("subscriptions service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("getSubscription returns subscription", async () => {
    mockDb.setReturn([
      [{ id: "s1", userId: "u1", tier: "free", status: "active" }],
    ])
    const result = await getSubscription("u1")
    expect(result?.userId).toBe("u1")
  })

  test("getOrCreateSubscription returns existing subscription", async () => {
    mockDb.setReturn([[{ id: "s1", userId: "u1" }]])
    const result = await getOrCreateSubscription("u1")
    expect(result.id).toBe("s1")
  })

  test("getOrCreateSubscription creates free subscription", async () => {
    mockDb.setReturn([[], [{ id: "s1", userId: "u1", tier: "free" }]])
    const result = await getOrCreateSubscription("u1")
    expect(result.tier).toBe("free")
  })

  test("createSubscription returns created subscription", async () => {
    mockDb.setReturn([[{ id: "s1", userId: "u1", tier: "pro" }]])
    const result = await createSubscription({
      userId: "u1",
      tier: "pro",
      status: "active",
      source: "polar",
    })
    expect(result.tier).toBe("pro")
  })

  test("updateSubscription returns updated subscription", async () => {
    mockDb.setReturn([[{ id: "s1", tier: "pro" }]])
    const result = await updateSubscription("u1", { tier: "pro" })
    expect(result.tier).toBe("pro")
  })

  test("updateSubscriptionByPolarId returns updated subscription", async () => {
    mockDb.setReturn([[{ id: "s1", polarSubscriptionId: "p1" }]])
    const result = await updateSubscriptionByPolarId("p1", { status: "active" })
    expect(result.polarSubscriptionId).toBe("p1")
  })

  test("cancelSubscription updates status", async () => {
    mockDb.setReturn([[{ id: "s1", status: "cancelled" }]])
    const result = await cancelSubscription("u1")
    expect(result.status).toBe("cancelled")
  })

  test("expireSubscription updates status", async () => {
    mockDb.setReturn([[{ id: "s1", status: "expired", tier: "free" }]])
    const result = await expireSubscription("u1")
    expect(result.status).toBe("expired")
  })

  test("getSubscriptionsByStatus returns subscriptions", async () => {
    mockDb.setReturn([[{ id: "s1", status: "active" }]])
    const result = await getSubscriptionsByStatus("active")
    expect(result).toHaveLength(1)
  })
})
