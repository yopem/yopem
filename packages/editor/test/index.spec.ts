import { describe, expect, test } from "vitest"

import { Editor, EditorContainer, EditorView } from "editor"

describe("editor index", () => {
  test("exports Editor, EditorContainer, and EditorView", () => {
    expect(typeof Editor).toBe("function")
    expect(typeof EditorContainer).toBe("function")
    expect(typeof EditorView).toBe("function")
  })
})
