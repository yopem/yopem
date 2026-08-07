import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({ SQL: class SQLMock {} }))
import { productCategoriesTable } from "db/schema/product-categories"
describe("product-categories schema", () => {
  test("exports the table", () => {
    expect(productCategoriesTable).toBeDefined()
  })
})
