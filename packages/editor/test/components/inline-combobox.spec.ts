import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/inline-combobox"

describe("components/inline-combobox", () => {
  test("exports all required combobox components", () => {
    expect(mod.InlineCombobox).toBeDefined()
    expect(mod.InlineComboboxContent).toBeDefined()
    expect(mod.InlineComboboxInput).toBeDefined()
    expect(mod.InlineComboboxItem).toBeDefined()
    expect(mod.InlineComboboxEmpty).toBeDefined()
    expect(mod.InlineComboboxGroup).toBeDefined()
    expect(mod.InlineComboboxGroupLabel).toBeDefined()
  })
})
