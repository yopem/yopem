import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/slider"

describe("ui/components/slider", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Slider).toBeDefined()
    expect(mod.SliderValue).toBeDefined()
    expect(mod.SliderPrimitive).toBeDefined()
  })
})
