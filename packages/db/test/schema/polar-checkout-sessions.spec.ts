import { describe, expect, test } from "vitest"

import {
  polarCheckoutSessionsTable,
  insertPolarCheckoutSessionSchema,
  updatePolarCheckoutSessionSchema,
  polarCheckoutSessionStatusEnum,
} from "db/schema/polar-checkout-sessions"

describe("polar-checkout-sessions schema", () => {
  test("exports the table", () => {
    expect(polarCheckoutSessionsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertPolarCheckoutSessionSchema.safeParse({
      userId: "u",
      checkoutId: "c",
      productId: "p",
      checkoutUrl: "https://x",
      amount: "10",
      status: "pending",
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updatePolarCheckoutSessionSchema.safeParse({
      userId: "u",
      checkoutId: "c",
      productId: "p",
      checkoutUrl: "https://x",
      amount: "10",
      status: "pending",
    })
    expect(result.success).toBe(true)
  })

  test("exports polarCheckoutSessionStatusEnum", () => {
    expect(polarCheckoutSessionStatusEnum).toBeDefined()
    expect(polarCheckoutSessionStatusEnum.length).toBeGreaterThan(0)
  })
})
