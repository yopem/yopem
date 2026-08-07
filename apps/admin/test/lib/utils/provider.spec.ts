import { describe, expect, test } from "vite-plus/test"

import {
  findModelProvider,
  getProviderMismatchMessage,
  providerNames,
  validateModelProviderMatch,
} from "@/lib/utils/provider"

describe("apps/admin/lib/utils/provider", () => {
  test("defines providerNames mapping", () => {
    expect(providerNames.openai).toBe("OpenAI")
    expect(providerNames.openrouter).toBe("OpenRouter")
    expect(providerNames.fal).toBe("fal.ai")
  })

  test("findModelProvider finds matching model and provider", () => {
    const models = [
      { modelId: "gpt-4", provider: "openai" },
      { modelId: "claude-3", provider: "openrouter" },
    ]

    expect(findModelProvider("gpt-4", "openai", models)).toEqual({
      modelId: "gpt-4",
      provider: "openai",
    })
  })

  test("validateModelProviderMatch validates provider match and returns message on mismatch", () => {
    const models = [{ modelId: "gpt-4", provider: "openai" }]

    const result = validateModelProviderMatch("openrouter", "gpt-4", models)
    expect(result.valid).toBe(false)
    expect(result.message).toBe(
      getProviderMismatchMessage("openrouter", "gpt-4"),
    )
  })
})
