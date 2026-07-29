import { describe, expect, test } from "vite-plus/test"

import { AIModelsSettings } from "@/components/settings/ai-model-settings"

describe("AIModelsSettings", () => {
  test("is a React component (memo-wrapped)", () => {
    expect(AIModelsSettings).toBeDefined()
    expect(
      typeof AIModelsSettings === "function" ||
        typeof AIModelsSettings === "object",
    ).toBe(true)
  })
})
