import { describe, expect, test } from "vitest"

import { Button, buttonVariants } from "ui/components/button"

describe("button", () => {
  test("Button is exported", () => {
    expect(Button).toBeDefined()
  })

  test("buttonVariants returns a non-empty class string", () => {
    const classes = buttonVariants()
    expect(typeof classes).toBe("string")
    expect(classes.length).toBeGreaterThan(0)
  })
})
