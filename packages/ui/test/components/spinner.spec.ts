import { describe, expect, test } from "vite-plus/test"

import { Spinner } from "ui/components/spinner"

describe("spinner", () => {
  test("Spinner is exported", () => {
    expect(Spinner).toBeDefined()
  })
})
