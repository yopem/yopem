import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

import {
  deleteAsset,
  getAdminUploadSizeSetting,
  getAssetById,
  insertAsset,
  listAssets,
} from "db/services/assets"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("assets service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("listAssets returns paginated assets", async () => {
    mockDb.setReturn([[{ id: "a1", filename: "x.webp" }]])
    const result = await listAssets({ limit: 10 })
    expect(result.assets).toHaveLength(1)
  })

  test("getAssetById returns asset", async () => {
    mockDb.setReturn([[{ id: "a1", filename: "x.webp" }]])
    const result = await getAssetById("a1")
    expect(result.id).toBe("a1")
  })

  test("insertAsset returns created asset", async () => {
    mockDb.setReturn([[{ id: "a1", filename: "x.webp" }]])
    const result = await insertAsset({
      filename: "x.webp",
      originalName: "x.webp",
      type: "images",
      size: 1,
      url: "https://x/x.webp",
    })
    expect(result.id).toBe("a1")
  })

  test("deleteAsset resolves", async () => {
    mockDb.setReturn([[], []])
    await expect(deleteAsset("a1")).resolves.toBeUndefined()
  })

  test("getAdminUploadSizeSetting returns setting", async () => {
    mockDb.setReturn([
      [{ id: "s1", settingKey: "uploadSize", settingValue: 10 }],
    ])
    const result = await getAdminUploadSizeSetting("uploadSize")
    expect(result.settingKey).toBe("uploadSize")
  })
})
