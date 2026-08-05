import * as v from "valibot"
import { describe, expect, test } from "vite-plus/test"

import {
  aiModelSchema,
  aiModelsTable,
  insertAIModelSchema,
  updateAIModelSchema,
} from "db/schema/ai-models"

describe("ai-models schema", () => {
  test("exports the table", () => {
    expect(aiModelsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = v.safeParse(insertAIModelSchema, {
      provider: "openai",
      modelId: "gpt-4",
      displayName: "GPT-4",
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = v.safeParse(updateAIModelSchema, {
      provider: "openai",
      modelId: "gpt-4",
      displayName: "GPT-4",
    })
    expect(result.success).toBe(true)
  })

  test("aiModelSchema validates a full select row", () => {
    const result = v.safeParse(aiModelSchema, {
      id: "aim_1",
      provider: "openai",
      modelId: "gpt-4",
      displayName: "GPT-4",
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(result.success).toBe(true)
  })
})
