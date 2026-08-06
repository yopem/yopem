import { describe, expect, test } from "bun:test"
import { hasActiveKeyForProvider } from "server/routers/admin"

import type { ApiKeyConfig } from "utils/api-input"

describe("admin router key cascade helpers", () => {
  test("hasActiveKeyForProvider returns true when an active key exists", () => {
    const keys: ApiKeyConfig[] = [
      {
        id: "k_1",
        provider: "openrouter",
        name: "A",
        apiKey: "encrypted",
        status: "active",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "k_2",
        provider: "openai",
        name: "B",
        apiKey: "encrypted",
        status: "active",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]

    expect(hasActiveKeyForProvider(keys, "openrouter")).toBe(true)
    expect(hasActiveKeyForProvider(keys, "openai")).toBe(true)
  })

  test("hasActiveKeyForProvider returns false when only inactive keys exist", () => {
    const keys: ApiKeyConfig[] = [
      {
        id: "k_1",
        provider: "openrouter",
        name: "A",
        apiKey: "encrypted",
        status: "inactive",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]

    expect(hasActiveKeyForProvider(keys, "openrouter")).toBe(false)
  })

  test("hasActiveKeyForProvider returns false when provider is absent", () => {
    const keys: ApiKeyConfig[] = [
      {
        id: "k_1",
        provider: "openai",
        name: "A",
        apiKey: "encrypted",
        status: "active",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]

    expect(hasActiveKeyForProvider(keys, "openrouter")).toBe(false)
  })
})
