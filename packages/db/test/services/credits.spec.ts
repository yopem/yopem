import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

import {
  addOverflowCredits,
  grantCredits,
  refundCredits,
} from "db/services/credits"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("credits service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("grantCredits grants new credits", async () => {
    const result = await grantCredits({
      userId: "u1",
      polarPaymentId: "p1",
      amount: "10",
      currency: "USD",
      productId: "pr1",
      creditsGranted: 100,
    })
    expect(result.alreadyProcessed).toBe(false)
    if (!result.alreadyProcessed) {
      expect(result.creditsGranted).toBe(100)
    }
  })

  test("addOverflowCredits adds overflow balance", async () => {
    const result = await addOverflowCredits({
      userId: "u1",
      polarPaymentId: "p2",
      amount: "5",
      currency: "USD",
      productId: "pr1",
      creditsGranted: 50,
    })
    expect(result.alreadyProcessed).toBe(false)
    if (!result.alreadyProcessed) {
      expect(result.creditsGranted).toBe(50)
    }
  })

  test("refundCredits throws when payment not found", async () => {
    mockDb.setReturn([[]])
    await expect(refundCredits({ polarPaymentId: "missing" })).rejects.toThrow(
      "not found",
    )
  })

  test("refundCredits processes full refund", async () => {
    mockDb.setReturn([
      [
        {
          userId: "u1",
          amount: "10",
          refundedAmount: "0",
          status: "succeeded",
          creditsGranted: 100,
        },
      ],
    ])
    const result = await refundCredits({ polarPaymentId: "p1" })
    expect(result.alreadyProcessed).toBe(false)
    expect(result.creditsRefunded).toBe(100)
    expect(result.isPartialRefund).toBe(false)
  })
})
