"use client"

import { createPlatePlugin } from "platejs/react"

export interface ImagePickerOptions {
  imagePicker?: () => Promise<string | undefined>
}

export const ImagePickerPlugin = createPlatePlugin<
  "imagePicker",
  ImagePickerOptions
>({
  key: "imagePicker",
})
