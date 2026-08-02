import { describe, expect, test } from "vite-plus/test"

import { DescriptionEditor } from "@/components/products/description-editor"

describe("DescriptionEditor", () => {
  test("is a React component", () => {
    expect(typeof DescriptionEditor).toBe("function")
  })
})
