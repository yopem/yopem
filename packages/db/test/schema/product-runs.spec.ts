import * as v from "valibot"
import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({ SQL: class SQLMock {} }))
import {
  productRunsTable,
  insertProductRunSchema,
  updateProductRunSchema,
  productRunStatusEnum,
} from "db/schema/product-runs"
describe("product-runs schema", () => {
  test("exports the table", () => {
    expect(productRunsTable).toBeDefined()
  })
  test("insert schema validates a valid row", () => {
    const result = v.safeParse(insertProductRunSchema, {
      productId: "p",
      userId: "u",
    })
    expect(result.success).toBe(true)
  })
  test("update schema validates a partial row", () => {
    const result = v.safeParse(updateProductRunSchema, {
      productId: "p",
      userId: "u",
    })
    expect(result.success).toBe(true)
  })
  test("exports productRunStatusEnum", () => {
    expect(productRunStatusEnum).toBeDefined()
    expect(productRunStatusEnum.length).toBeGreaterThan(0)
  })
})
