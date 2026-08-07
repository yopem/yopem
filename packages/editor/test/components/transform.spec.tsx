import { BaseImagePlugin } from "@platejs/media"
import { createSlateEditor, KEYS } from "platejs"
import { describe, expect, test, vi } from "vite-plus/test"

import { ImagePickerPlugin } from "editor/image-picker-kit"
import * as mod from "editor/transform"

describe("editor/transform", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.insertBlock).toBeDefined()
    expect(mod.insertInlineElement).toBeDefined()
    expect(mod.insertImageAsset).toBeDefined()
    expect(mod.setBlockType).toBeDefined()
    expect(mod.getBlockType).toBeDefined()
  })

  test("insertImageAsset inserts an image node when picker returns a URL", async () => {
    const picker = vi.fn().mockResolvedValue("https://example.com/photo.webp")
    const editor = createSlateEditor({
      plugins: [
        BaseImagePlugin,
        ImagePickerPlugin.configure({
          options: { imagePicker: picker },
        }),
      ],
    })

    editor.tf.setValue([{ type: KEYS.p, children: [{ text: "" }] }])
    editor.tf.select({ path: [0, 0], offset: 0 })

    await mod.insertImageAsset(editor)

    expect(picker).toHaveBeenCalled()
    expect(editor.children.some((node) => node.type === KEYS.img)).toBe(true)
    expect(editor.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: KEYS.img,
          url: "https://example.com/photo.webp",
        }),
      ]),
    )
  })

  test("insertImageAsset does nothing when picker is not configured", async () => {
    const editor = createSlateEditor({
      plugins: [BaseImagePlugin],
    })

    editor.tf.setValue([{ type: KEYS.p, children: [{ text: "" }] }])

    await mod.insertImageAsset(editor)

    expect(editor.children[0]).toMatchObject({ type: KEYS.p })
  })
})
