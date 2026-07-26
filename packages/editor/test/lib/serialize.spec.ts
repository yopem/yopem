import { describe, expect, test } from "vitest"

import {
  deserializeHtmlToSlate,
  serializeSlateToHtml,
} from "editor/lib/serialize"

describe("serialize", () => {
  test("exports deserializeHtmlToSlate", () => {
    expect(typeof deserializeHtmlToSlate).toBe("function")
  })

  test("exports serializeSlateToHtml", () => {
    expect(typeof serializeSlateToHtml).toBe("function")
  })
})
