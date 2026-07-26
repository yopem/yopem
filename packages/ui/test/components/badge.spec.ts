import { describe, expect, test } from "vite-plus/test"

import { Badge, badgeVariants } from "ui/components/badge"

describe("badge", () => {
  test("Badge is exported", () => {
    expect(Badge).toBeDefined()
  })

  test("badgeVariants returns a non-empty class string", () => {
    const classes = badgeVariants()
    expect(typeof classes).toBe("string")
    expect(classes.length).toBeGreaterThan(0)
  })
})
