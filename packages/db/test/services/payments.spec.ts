import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

import {
  completePolarCheckoutSession,
  recordPolarPaymentEvent,
} from "db/services/payments"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("payments service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("recordPolarPaymentEvent inserts event", async () => {
    mockDb.setReturn([[]])
    await expect(
      recordPolarPaymentEvent({ eventType: "charge.succeeded", payload: {} }),
    ).resolves.toBeUndefined()
  })

  test("completePolarCheckoutSession updates session", async () => {
    mockDb.setReturn([[]])
    await expect(completePolarCheckoutSession("c1")).resolves.toBeUndefined()
  })
})
