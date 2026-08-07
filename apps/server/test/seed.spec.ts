import { describe, expect, test } from "bun:test"
import {
  aiModels,
  categories,
  products,
  tags,
  VALID_OUTPUT_FORMATS,
  VALID_PROVIDERS,
} from "server/scripts/seed"

const PROVIDER_SET = new Set(VALID_PROVIDERS)
const OUTPUT_FORMAT_SET = new Set(VALID_OUTPUT_FORMATS)

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

describe("seed data", () => {
  test("category names are unique and non-empty", () => {
    const names = categories.map((category) => category.name)
    expect(names.every((name) => name.length > 0)).toBe(true)
    expect(findDuplicates(names)).toEqual([])
  })

  test("tag names are unique and non-empty", () => {
    const names = tags.map((tag) => tag.name)
    expect(names.every((name) => name.length > 0)).toBe(true)
    expect(findDuplicates(names)).toEqual([])
  })

  test("product names are unique and non-empty", () => {
    const names = products.map((product) => product.name)
    expect(names.every((name) => name.length > 0)).toBe(true)
    expect(findDuplicates(names)).toEqual([])
  })

  test("every product provider is a valid ApiKeyProvider", () => {
    for (const product of products) {
      expect(PROVIDER_SET.has(product.provider)).toBe(true)
    }
  })

  test("every product outputFormat is valid", () => {
    for (const product of products) {
      expect(OUTPUT_FORMAT_SET.has(product.outputFormat)).toBe(true)
    }
  })

  test("every product references existing categories and tags", () => {
    const categoryNames = new Set(categories.map((category) => category.name))
    const tagNames = new Set(tags.map((tag) => tag.name))

    for (const product of products) {
      for (const categoryName of product.categories) {
        expect(categoryNames.has(categoryName)).toBe(true)
      }
      for (const tagName of product.tags) {
        expect(tagNames.has(tagName)).toBe(true)
      }
    }
  })

  test("every product has a non-negative integer creditsPerRun", () => {
    for (const product of products) {
      expect(Number.isInteger(product.creditsPerRun)).toBe(true)
      expect(product.creditsPerRun).toBeGreaterThanOrEqual(0)
    }
  })

  test("every AI model provider is a valid ApiKeyProvider", () => {
    for (const model of aiModels) {
      expect(PROVIDER_SET.has(model.provider)).toBe(true)
    }
  })

  test("every product modelEngine exists in aiModels", () => {
    const modelKeys = new Set(
      aiModels.map((model) => `${model.provider}:${model.modelId}`),
    )

    for (const product of products) {
      expect(modelKeys.has(`${product.provider}:${product.modelEngine}`)).toBe(
        true,
      )
    }
  })

  test("media products use a fal image model", () => {
    for (const product of products) {
      if (
        product.outputFormat !== "image" &&
        product.outputFormat !== "video"
      ) {
        continue
      }
      expect(product.provider).toBe("fal")
      const model = aiModels.find(
        (m) => m.provider === "fal" && m.modelId === product.modelEngine,
      )
      expect(model).toBeDefined()
    }
  })
})
