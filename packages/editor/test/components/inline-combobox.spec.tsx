import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/inline-combobox"

describe("editor/inline-combobox", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.InlineCombobox).toBeDefined()
    expect(mod.InlineComboboxInput).toBeDefined()
    expect(mod.InlineComboboxContent).toBeDefined()
    expect(mod.InlineComboboxItem).toBeDefined()
    expect(mod.InlineComboboxEmpty).toBeDefined()
  })
})
