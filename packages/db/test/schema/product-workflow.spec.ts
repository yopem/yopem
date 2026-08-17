import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({ SQL: class SQLMock {} }))
import * as mod from "db/schema/product-workflow"
describe("packages/db/schema/product-workflow", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.inputFieldTypeSchema).toBeDefined()
    expect(mod.selectOptionSchema).toBeDefined()
    expect(mod.inputFieldSchema).toBeDefined()
    expect(mod.workflowNodeTypeSchema).toBeDefined()
    expect(mod.workflowPositionSchema).toBeDefined()
  })
})
