import {
  aiModels,
  categories,
  products,
  tags,
  VALID_OUTPUT_FORMATS,
  VALID_PROVIDERS,
} from "server/seed"
import { describe, expect, test } from "vite-plus/test"

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

  test("every product costPerRun is a valid decimal", () => {
    for (const product of products) {
      expect(/^\d+(\.\d+)?$/.test(product.costPerRun)).toBe(true)
      expect(Number(product.costPerRun)).not.toBeNaN()
    }
  })

  test("every AI model provider is a valid ApiKeyProvider", () => {
    for (const model of aiModels) {
      expect(PROVIDER_SET.has(model.provider)).toBe(true)
    }
  })

  test("every AI model has a unique provider:modelId pair", () => {
    const keys = aiModels.map((model) => `${model.provider}:${model.modelId}`)
    expect(findDuplicates(keys)).toEqual([])
  })
})
