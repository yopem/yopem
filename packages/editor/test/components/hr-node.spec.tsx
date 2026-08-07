import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/hr-node"

describe("editor/hr-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.HrElement).toBeDefined()
  })
})
