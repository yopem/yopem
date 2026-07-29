import { describe, expect, test } from "vite-plus/test"

import { UploadProgress } from "@/components/assets/upload-progress"

describe("UploadProgress", () => {
  test("is a React component", () => {
    expect(typeof UploadProgress).toBe("function")
  })
})
