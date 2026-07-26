import { describe, expect, test } from "vitest"

import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
} from "ui/components/progress"

describe("progress", () => {
  test("Progress is exported", () => {
    expect(Progress).toBeDefined()
  })

  test("ProgressLabel is exported", () => {
    expect(ProgressLabel).toBeDefined()
  })

  test("ProgressTrack is exported", () => {
    expect(ProgressTrack).toBeDefined()
  })

  test("ProgressIndicator is exported", () => {
    expect(ProgressIndicator).toBeDefined()
  })

  test("ProgressValue is exported", () => {
    expect(ProgressValue).toBeDefined()
  })
})
