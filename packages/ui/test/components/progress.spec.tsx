import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/progress"

describe("ui/components/progress", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Progress).toBeDefined()
    expect(mod.ProgressLabel).toBeDefined()
    expect(mod.ProgressTrack).toBeDefined()
    expect(mod.ProgressIndicator).toBeDefined()
    expect(mod.ProgressValue).toBeDefined()
  })
})
