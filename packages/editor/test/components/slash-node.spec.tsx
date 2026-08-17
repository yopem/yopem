import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("editor/transform", () => ({
  insertBlock: vi.fn(),
  insertInlineElement: vi.fn(),
  insertImageAsset: vi.fn(),
}))

import { createSlashGroups, SlashInputElement } from "editor/slash-node"
import { insertImageAsset } from "editor/transform"

describe("editor/slash-node", () => {
  test("exports module members", () => {
    expect(createSlashGroups).toBeDefined()
    expect(SlashInputElement).toBeDefined()
  })

  test("includes Image item when picker is configured", () => {
    const groups = createSlashGroups(true)
    const inlineGroup = groups.find((group) => group.group === "Inline")
    const imageItem = inlineGroup?.items.find((item) => item.label === "Image")

    expect(imageItem).toBeDefined()
    expect(imageItem?.keywords).toContain("image")
  })

  test("excludes Image item when picker is not configured", () => {
    const groups = createSlashGroups(false)
    const inlineGroup = groups.find((group) => group.group === "Inline")
    const imageItem = inlineGroup?.items.find((item) => item.label === "Image")

    expect(imageItem).toBeUndefined()
  })

  test("Image item onSelect invokes the image picker", () => {
    const groups = createSlashGroups(true)
    const inlineGroup = groups.find((group) => group.group === "Inline")
    const imageItem = inlineGroup?.items.find((item) => item.label === "Image")
    const editor = {} as never

    imageItem?.onSelect(editor, imageItem.value)

    expect(insertImageAsset).toHaveBeenCalledWith(editor)
  })
})
