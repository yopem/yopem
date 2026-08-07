import { describe, expect, test } from "vite-plus/test"

import { slugify } from "utils/slug"

describe("slugify", () => {
  test("converts text to lowercase with hyphen separators", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  test("handles special characters and accents", () => {
    expect(slugify("Café & Restaurant!")).toBe("cafe-restaurant")
  })

  test("collapses multiple spaces, underscores, and hyphens", () => {
    expect(slugify("foo   bar___baz---qux")).toBe("foo-bar-baz-qux")
  })

  test("trims leading and trailing hyphens", () => {
    expect(slugify("---test-slug---")).toBe("test-slug")
  })

  test("handles empty string", () => {
    expect(slugify("")).toBe("")
  })
})
