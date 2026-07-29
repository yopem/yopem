import { describe, expect, test } from "vite-plus/test"

import { UploadDropzone } from "@/components/assets/upload-dropzone"

describe("UploadDropzone", () => {
  test("is a React component", () => {
    expect(typeof UploadDropzone).toBe("function")
  })
})
