import { describe, expect, test } from "vite-plus/test"

import { getInitials } from "@/lib/get-initials"

describe("getInitials", () => {
  test("builds initials from a full name", () => {
    expect(getInitials("John Doe", "john@example.com")).toBe("JD")
  })

  test("falls back to email when name is missing", () => {
    expect(getInitials(null, "john@example.com")).toBe("J")
  })

  test("caps at two initials for multi-word names", () => {
    expect(getInitials("John Middle Doe", "john@example.com")).toBe("JM")
  })

  test("uppercases single-word names", () => {
    expect(getInitials("john", "john@example.com")).toBe("J")
  })
})
