import { describe, expect, test } from "vitest"

import {
  assetsTable,
  insertAssetSchema,
  updateAssetSchema,
  assetTypeEnum,
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

  test("exports assetTypeEnum", () => {
    expect(assetTypeEnum).toBeDefined()
    expect(assetTypeEnum.length).toBeGreaterThan(0)
  })
})
