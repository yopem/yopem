import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({ SQL: class SQLMock {} }))
import * as mod from "db/schema/product-workflow-utils"
describe("packages/db/schema/product-workflow-utils", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.getInputFieldsFromWorkflow).toBeDefined()
    expect(mod.getWorkflowOutputNames).toBeDefined()
    expect(mod.createDefaultWorkflow).toBeDefined()
    expect(mod.findNodeById).toBeDefined()
  })
})
