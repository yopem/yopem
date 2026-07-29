import { describe, expect, test } from "vite-plus/test"

import { AssetCard } from "@/components/assets/asset-card"

describe("AssetCard", () => {
  test("is a React component (memo-wrapped)", () => {
    expect(AssetCard).toBeDefined()
    expect(typeof AssetCard === "function" || typeof AssetCard === "object").toBe(true)
  })
})
