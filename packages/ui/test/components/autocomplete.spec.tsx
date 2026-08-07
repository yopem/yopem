import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/autocomplete"

describe("ui/components/autocomplete", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Autocomplete).toBeDefined()
    expect(mod.AutocompleteInput).toBeDefined()
    expect(mod.AutocompletePopup).toBeDefined()
    expect(mod.AutocompleteItem).toBeDefined()
    expect(mod.AutocompleteSeparator).toBeDefined()
  })
})
