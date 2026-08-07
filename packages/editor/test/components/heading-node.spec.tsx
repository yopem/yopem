import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/heading-node"

describe("editor/heading-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.H1Element).toBeDefined()
    expect(mod.H2Element).toBeDefined()
    expect(mod.H3Element).toBeDefined()
    expect(mod.H4Element).toBeDefined()
    expect(mod.H5Element).toBeDefined()
  })
})
