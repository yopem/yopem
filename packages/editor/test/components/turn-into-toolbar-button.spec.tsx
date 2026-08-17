import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/turn-into-toolbar-button"

describe("editor/turn-into-toolbar-button", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.turnIntoItems).toBeDefined()
    expect(mod.TurnIntoToolbarButton).toBeDefined()
  })
})
