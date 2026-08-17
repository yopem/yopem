import * as v from "valibot"
import { describe, expect, test } from "vite-plus/test"

import {
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  apiKeyProviderSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
} from "utils/api-input"

describe("apiKeyProviderSchema", () => {
  test("accepts valid providers", () => {
    expect(v.parse(apiKeyProviderSchema, "openai")).toBe("openai")
    expect(v.parse(apiKeyProviderSchema, "openrouter")).toBe("openrouter")
    expect(v.parse(apiKeyProviderSchema, "fal")).toBe("fal")
  })

  test("rejects invalid providers", () => {
    expect(() => v.parse(apiKeyProviderSchema, "invalid")).toThrow()
  })
})

describe("addApiKeyInputSchema", () => {
  test("accepts valid input", () => {
    const result = v.parse(addApiKeyInputSchema, {
      provider: "openai",
      name: "My Key",
      apiKey: "sk-...",
    })
    expect(result.name).toBe("My Key")
    expect(result.status).toBe("active")
  })

  test("rejects empty name", () => {
    expect(() =>
      v.parse(addApiKeyInputSchema, {
        provider: "openai",
        name: "",
        apiKey: "sk-...",
      }),
    ).toThrow("Name is required")
  })
})

describe("updateApiKeyInputSchema", () => {
  test("accepts partial update", () => {
    const result = v.parse(updateApiKeyInputSchema, {
      id: "key_1",
      name: "Updated Key",
    })
    expect(result.name).toBe("Updated Key")
  })
})

describe("deleteApiKeyInputSchema", () => {
  test("requires id", () => {
    const result = v.parse(deleteApiKeyInputSchema, { id: "key_1" })
    expect(result.id).toBe("key_1")
  })
})

describe("apiKeyConfigSchema", () => {
  test("accepts valid config", () => {
    const result = v.parse(apiKeyConfigSchema, {
      id: "key_1",
      provider: "openai",
      name: "My Key",
      apiKey: "sk-...",
      status: "active",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
    })
    expect(result.name).toBe("My Key")
  })
})
