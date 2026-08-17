import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({ SQL: class SQLMock {} }))
import { productTagsTable } from "db/schema/product-tags"
describe("product-tags schema", () => {
  test("exports the table", () => {
    expect(productTagsTable).toBeDefined()
  })
})
