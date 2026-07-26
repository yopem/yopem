import { describe, expect, test } from "vite-plus/test"

import { Toggle, toggleVariants } from "ui/components/toggle"

describe("toggle", () => {
  test("Toggle is exported", () => {
    expect(Toggle).toBeDefined()
  })

  test("toggleVariants returns a non-empty class string", () => {
    const classes = toggleVariants()
    expect(typeof classes).toBe("string")
    expect(classes.length).toBeGreaterThan(0)
  })
})
