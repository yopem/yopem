import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

import {
  createAIModel,
  deleteAIModelById,
  findAIModelById,
  findAIModelByProviderAndModelId,
  getActivityFeed,
  getAiRequestsHistory,
  getApiKeyStats,
  getSetting,
  listAIModels,
  updateAIModelById,
  upsertSetting,
} from "db/services/admin"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("admin service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("getSetting returns the first matching setting", async () => {
    mockDb.setReturn([
      [{ id: "s1", settingKey: "theme", settingValue: "dark" }],
    ])
    const result = await getSetting("theme")
    expect(result).toEqual({
      id: "s1",
      settingKey: "theme",
      settingValue: "dark",
    })
  })

  test("getSetting returns null when no setting found", async () => {
    mockDb.setReturn([[]])
    const result = await getSetting("missing")
    expect(result).toBeNull()
  })

  test("upsertSetting updates existing setting", async () => {
    mockDb.setReturn([
      [{ id: "s1", settingKey: "theme", settingValue: "dark" }],
      [{ id: "s1", settingKey: "theme", settingValue: "light" }],
    ])
    const result = await upsertSetting("theme", "light")
    expect(result.settingValue).toBe("light")
  })

  test("upsertSetting creates new setting when missing", async () => {
    mockDb.setReturn([
      [],
      [{ id: "s2", settingKey: "theme", settingValue: "auto" }],
    ])
    const result = await upsertSetting("theme", "auto")
    expect(result.settingKey).toBe("theme")
  })

  test("getActivityFeed returns succeeded payments", async () => {
    mockDb.setReturn([
      [
        {
          userId: "u1",
          userName: "User",
          amount: "10",
          currency: "USD",
          creditsGranted: 100,
        },
      ],
    ])
    const result = await getActivityFeed(10)
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe("u1")
  })

  test("getAiRequestsHistory returns runs after start date", async () => {
    mockDb.setReturn([[{ createdAt: new Date() }]])
    const result = await getAiRequestsHistory({ startDate: new Date() })
    expect(result).toHaveLength(1)
  })

  test("listAIModels returns models", async () => {
    mockDb.setReturn([[{ id: "m1", provider: "openai", modelId: "gpt-4" }]])
    const result = await listAIModels()
    expect(result).toHaveLength(1)
  })

  test("findAIModelByProviderAndModelId returns match", async () => {
    mockDb.setReturn([[{ id: "m1" }]])
    const result = await findAIModelByProviderAndModelId("openai", "gpt-4")
    expect(result).toEqual({ id: "m1" })
  })

  test("findAIModelById returns match", async () => {
    mockDb.setReturn([[{ id: "m1" }]])
    const result = await findAIModelById("m1")
    expect(result).toEqual({ id: "m1" })
  })

  test("createAIModel returns created model", async () => {
    mockDb.setReturn([
      [
        {
          id: "m1",
          provider: "openai",
          modelId: "gpt-4",
          displayName: "GPT-4",
          isEnabled: true,
        },
      ],
    ])
    const result = await createAIModel({
      provider: "openai",
      modelId: "gpt-4",
      displayName: "GPT-4",
      isEnabled: true,
    })
    expect(result.modelId).toBe("gpt-4")
  })

  test("updateAIModelById returns updated model", async () => {
    mockDb.setReturn([[{ id: "m1", displayName: "GPT-4o" }]])
    const result = await updateAIModelById("m1", { displayName: "GPT-4o" })
    expect(result.displayName).toBe("GPT-4o")
  })

  test("deleteAIModelById resolves", async () => {
    mockDb.setReturn([[]])
    await expect(deleteAIModelById("m1")).resolves.toBeUndefined()
  })

  test("getApiKeyStats returns metrics", async () => {
    mockDb.setReturn([
      [{ count: 10 }],
      [{ count: 5, cost: 1.5 }],
      [{ cost: 0.5 }],
    ])
    const result = await getApiKeyStats()
    expect(result.totalRequests).toBe(10)
    expect(result.requestsThisMonth).toBe(5)
  })
})
