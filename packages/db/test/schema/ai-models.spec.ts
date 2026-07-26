import { describe, expect, test } from "vitest"

import {
  aiModelsTable,
  insertAIModelSchema,
  updateAIModelSchema,
} from "db/schema/ai-models"

describe("ai-models schema", () => {
  test("exports the table", () => {
    expect(aiModelsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertAIModelSchema.safeParse({
      provider: "openai",
      modelId: "gpt-4",
      displayName: "GPT-4",
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateAIModelSchema.safeParse({
      provider: "openai",
      modelId: "gpt-4",
      displayName: "GPT-4",
    })
    expect(result.success).toBe(true)
  })
})
