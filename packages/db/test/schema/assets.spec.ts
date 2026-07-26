import { describe, expect, test } from "vite-plus/test"

import {
  assetSchema,
  assetsTable,
  assetTypeEnum,
  insertAssetSchema,
  updateAssetSchema,
} from "db/schema/assets"

describe("assets schema", () => {
  test("exports the table", () => {
    expect(assetsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertAssetSchema.safeParse({
      filename: "a.webp",
      originalName: "a.webp",
      type: "images",
      size: 1,
      url: "https://x/a.webp",
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateAssetSchema.safeParse({
      filename: "a.webp",
      originalName: "a.webp",
      type: "images",
      size: 1,
      url: "https://x/a.webp",
    })
    expect(result.success).toBe(true)
  })

  test("assetSchema validates a full select row", () => {
    const result = assetSchema.safeParse({
      id: "ast_1",
      filename: "a.webp",
      originalName: "a.webp",
      type: "images",
      size: 1,
      url: "https://x/a.webp",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(result.success).toBe(true)
  })

  test("exports assetTypeEnum", () => {
    expect(assetTypeEnum).toBeDefined()
    expect(assetTypeEnum.length).toBeGreaterThan(0)
  })
})
