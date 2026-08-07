import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-upload-toast"

describe("editor/media-upload-toast", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.MediaUploadToast).toBeDefined()
  })
})
