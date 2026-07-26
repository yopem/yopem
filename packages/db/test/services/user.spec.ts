import { beforeEach, describe, expect, test, vi } from "vitest"

import {
  addCredits,
  deductCreditsForRun,
  deductOverflowCredit,
  getPaymentHistory,
  getPendingCheckouts,
  getUserCredits,
  getUserRuns,
  getUserSettings,
  getUserStats,
  getUserTransactions,
  initUserCredits,
  insertCheckoutSession,
  upsertPolarCustomer,
  upsertUserSettings,
} from "db/services/user"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("user service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("getUserStats returns defaults when no credits", async () => {
    mockDb.setReturn([[], [{ count: 0 }]])
    const result = await getUserStats("u1")
    expect(result.balance).toBe("0")
    expect(result.totalRuns).toBe(0)
  })

  test("getUserRuns returns runs", async () => {
    mockDb.setReturn([[{ id: "r1", productId: "p1", productName: "Prod" }]])
    const result = await getUserRuns("u1", { limit: 10 })
    expect(result.runs).toHaveLength(1)
  })

  test("getUserCredits returns credits", async () => {
    mockDb.setReturn([[{ id: "c1", userId: "u1", balance: "10" }]])
    const result = await getUserCredits("u1")
    expect(result?.balance).toBe("10")
  })

  test("getUserTransactions returns transactions", async () => {
    mockDb.setReturn([[{ id: "tx1", amount: "10", type: "purchase" }]])
    const result = await getUserTransactions("u1", { limit: 10 })
    expect(result).toHaveLength(1)
  })

  test("getUserSettings returns settings", async () => {
    mockDb.setReturn([[{ id: "us1", userId: "u1" }]])
    const result = await getUserSettings("u1")
    expect(result?.userId).toBe("u1")
  })

  test("upsertUserSettings updates existing settings", async () => {
    mockDb.setReturn([[{ id: "us1" }], [{ id: "us1", bio: "hello" }]])
    const result = await upsertUserSettings("u1", { bio: "hello" })
    expect(result.bio).toBe("hello")
  })

  test("upsertPolarCustomer updates polar customer id", async () => {
    mockDb.setReturn([[{ id: "us1" }], [{ id: "us1", polarCustomerId: "c1" }]])
    const result = await upsertPolarCustomer("u1", "c1")
    expect(result.polarCustomerId).toBe("c1")
  })

  test("insertCheckoutSession returns session", async () => {
    mockDb.setReturn([[{ id: "cs1", checkoutId: "c1" }]])
    const result = await insertCheckoutSession({
      userId: "u1",
      checkoutId: "c1",
      productId: "p1",
      checkoutUrl: "https://x",
      amount: "10",
    })
    expect(result.checkoutId).toBe("c1")
  })

  test("getPaymentHistory returns payments", async () => {
    mockDb.setReturn([[{ id: "pay1", polarPaymentId: "p1" }]])
    const result = await getPaymentHistory("u1", { limit: 10 })
    expect(result).toHaveLength(1)
  })

  test("getPendingCheckouts returns pending sessions", async () => {
    mockDb.setReturn([[{ id: "cs1", status: "pending" }]])
    const result = await getPendingCheckouts("u1")
    expect(result).toHaveLength(1)
  })

  test("initUserCredits returns existing credits", async () => {
    mockDb.setReturn([[{ id: "c1", userId: "u1" }]])
    const result = await initUserCredits("u1")
    expect(result.id).toBe("c1")
  })

  test("deductCreditsForRun resolves", async () => {
    mockDb.setReturn([[]])
    await expect(
      deductCreditsForRun("u1", 5, "r1", "Prod"),
    ).resolves.toBeUndefined()
  })

  test("deductOverflowCredit resolves", async () => {
    mockDb.setReturn([[{ rowCount: 1 }]])
    const result = await deductOverflowCredit("u1", "Prod")
    expect(typeof result).toBe("boolean")
  })

  test("addCredits resolves", async () => {
    mockDb.setReturn([[]])
    await expect(addCredits("u1", 10)).resolves.toBeUndefined()
  })
})
