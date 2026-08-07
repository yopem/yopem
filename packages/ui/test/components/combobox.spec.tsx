import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/combobox"

describe("ui/components/combobox", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ComboboxContext).toBeDefined()
    expect(mod.Combobox).toBeDefined()
    expect(mod.ComboboxChipsInput).toBeDefined()
    expect(mod.ComboboxInput).toBeDefined()
    expect(mod.ComboboxTrigger).toBeDefined()
  })
})
