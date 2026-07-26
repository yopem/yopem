import { describe, expect, test } from "vite-plus/test"

import { Textarea } from "ui/components/textarea"

describe("textarea", () => {
  test("Textarea is exported", () => {
    expect(Textarea).toBeDefined()
  })
})
