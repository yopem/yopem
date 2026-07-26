import { describe, expect, test } from "vitest"

import { Slider, SliderValue } from "ui/components/slider"

describe("slider", () => {
  test("Slider is exported", () => {
    expect(Slider).toBeDefined()
  })

  test("SliderValue is exported", () => {
    expect(SliderValue).toBeDefined()
  })
})
