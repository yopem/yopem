import { describe, expect, test } from "vite-plus/test"

import {
  polarPaymentsTable,
  insertPolarPaymentSchema,
  updatePolarPaymentSchema,
  polarPaymentStatusEnum,
} from "db/schema/polar-payments"

describe("polar-payments schema", () => {
  test("exports the table", () => {
    expect(polarPaymentsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertPolarPaymentSchema.safeParse({
      userId: "u",
      polarPaymentId: "p",
      amount: "1.00",
      status: "succeeded",
      productId: "pr",
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updatePolarPaymentSchema.safeParse({
      userId: "u",
      polarPaymentId: "p",
      amount: "1.00",
      status: "succeeded",
      productId: "pr",
    })
    expect(result.success).toBe(true)
  })

  test("exports polarPaymentStatusEnum", () => {
    expect(polarPaymentStatusEnum).toBeDefined()
    expect(polarPaymentStatusEnum.length).toBeGreaterThan(0)
  })
})
