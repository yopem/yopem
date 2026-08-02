import { describe, expect, test } from "vite-plus/test"

import { slateToPlainText } from "editor/serialize"

describe("slateToPlainText", () => {
  test("exports a function", () => {
    expect(typeof slateToPlainText).toBe("function")
  })

  test("returns empty string for a single empty paragraph", () => {
    const value = [{ type: "p", children: [{ text: "" }] }]
    expect(slateToPlainText(value)).toBe("")
  })

  test("extracts text from a single paragraph", () => {
    const value = [{ type: "p", children: [{ text: "Hello world" }] }]
    expect(slateToPlainText(value)).toBe("Hello world")
  })

  test("joins multiple blocks with newlines", () => {
    const value = [
      { type: "p", children: [{ text: "First" }] },
      { type: "p", children: [{ text: "Second" }] },
    ]
    expect(slateToPlainText(value)).toBe("First\nSecond")
  })

  test("concatenates consecutive text leaves in one block", () => {
    const value = [
      {
        type: "p",
        children: [
          { text: "Hello " },
          { text: "bold", bold: true },
          { text: " world" },
        ],
      },
    ]
    expect(slateToPlainText(value)).toBe("Hello bold world")
  })

  test("walks nested list nodes", () => {
    const value = [
      {
        type: "ul",
        children: [
          { type: "li", children: [{ text: "one" }] },
          { type: "li", children: [{ text: "two" }] },
        ],
      },
    ]
    expect(slateToPlainText(value)).toBe("one\ntwo")
  })

  test("handles empty array input", () => {
    expect(slateToPlainText([])).toBe("")
  })
})
