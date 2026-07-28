import { aiModels, planModelSeed } from "server/seed"
import { describe, expect, test } from "vite-plus/test"

import type { ApiKeyProvider } from "utils/api-input"

describe("planModelSeed", () => {
  test("creates all models when no existing models and all providers allowed", () => {
    const allowed = new Set<ApiKeyProvider>(["openai", "openrouter", "fal"])

    const result = planModelSeed([], allowed)

    expect(result.created).toEqual(aiModels)
    expect(result.skipped).toBe(0)
    expect(result.removed).toHaveLength(0)
  })

  test("skips existing models and creates missing ones for allowed providers", () => {
    const allowed = new Set<ApiKeyProvider>(["openai"])
    const existing = [{ provider: "openai", modelId: "gpt-4o" }]

    const result = planModelSeed(existing, allowed)

    expect(result.skipped).toBe(1)
    expect(
      result.created.some((model) => model.modelId === "gpt-4o-mini"),
    ).toBe(true)
    expect(
      result.created.some((model) => model.provider === "openrouter"),
    ).toBe(false)
    expect(result.removed).toHaveLength(0)
  })

  test("removes existing models for providers without active keys", () => {
    const allowed = new Set<ApiKeyProvider>(["openai"])
    const existing = [
      { provider: "openai", modelId: "gpt-4o" },
      { provider: "openrouter", modelId: "openai/gpt-4o-mini" },
    ]

    const result = planModelSeed(existing, allowed)

    expect(result.removed).toEqual([
      {
        provider: "openrouter",
        modelId: "openai/gpt-4o-mini",
        displayName: "OpenRouter GPT-4o Mini",
      },
    ])
    expect(result.removed.some((model) => model.provider === "openai")).toBe(
      false,
    )
  })

  test("returns empty plan when nothing changes", () => {
    const allowed = new Set<ApiKeyProvider>(["openai", "openrouter", "fal"])
    const existing = aiModels.map((model) => ({
      provider: model.provider,
      modelId: model.modelId,
    }))

    const result = planModelSeed(existing, allowed)

    expect(result.created).toHaveLength(0)
    expect(result.skipped).toBe(aiModels.length)
    expect(result.removed).toHaveLength(0)
  })
})
