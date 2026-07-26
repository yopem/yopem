import { describe, expect, test } from "vite-plus/test"

import {
  creditTransactionsTable,
  insertCreditTransactionSchema,
  updateCreditTransactionSchema,
  creditTransactionTypeEnum,
} from "db/schema/credit-transactions"

describe("credit-transactions schema", () => {
  test("exports the table", () => {
    expect(creditTransactionsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertCreditTransactionSchema.safeParse({
      userId: "u",
      amount: "1.00",
      type: "purchase",
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateCreditTransactionSchema.safeParse({
      userId: "u",
      amount: "1.00",
      type: "purchase",
    })
    expect(result.success).toBe(true)
  })

  test("exports creditTransactionTypeEnum", () => {
    expect(creditTransactionTypeEnum).toBeDefined()
    expect(creditTransactionTypeEnum.length).toBeGreaterThan(0)
  })
})
