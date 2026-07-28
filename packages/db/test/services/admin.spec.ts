import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"
import {
  deleteAIModelsByProvider,
  findAIModelByProviderAndModelId,
} from "db/services/admin"
import type { MockDb } from "db/test-utils/mock-db"

const mockDb = db as unknown as MockDb

describe("admin service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  describe("findAIModelByProviderAndModelId", () => {
    test("returns model with id and isEnabled when found", async () => {
      mockDb.setReturn([[{ id: "m_1", isEnabled: true }]])

      const result = await findAIModelByProviderAndModelId(
        "openrouter",
        "openai/gpt-4o-mini",
      )

      expect(result).toEqual({ id: "m_1", isEnabled: true })
    })

    test("returns null when model is not found", async () => {
      mockDb.setReturn([[]])

      const result = await findAIModelByProviderAndModelId(
        "openrouter",
        "missing-model",
      )

      expect(result).toBeNull()
    })
  })

  describe("deleteAIModelsByProvider", () => {
    test("deletes models for the given provider", async () => {
      mockDb.setReturn([[]])

      await expect(
        deleteAIModelsByProvider("openrouter"),
      ).resolves.toBeUndefined()
    })
  })
})
