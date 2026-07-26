import { describe, expect, test } from "vitest"

import {
  polarPaymentEventsTable,
  insertPolarPaymentEventSchema,
  updatePolarPaymentEventSchema,
} from "db/schema/polar-payment-events"

describe("polar-payment-events schema", () => {
  test("exports the table", () => {
    expect(polarPaymentEventsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertPolarPaymentEventSchema.safeParse({
      polarEventId: "e",
      eventType: "charge.succeeded",
      payload: {},
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updatePolarPaymentEventSchema.safeParse({
      polarEventId: "e",
      eventType: "charge.succeeded",
      payload: {},
    })
    expect(result.success).toBe(true)
  })
})
