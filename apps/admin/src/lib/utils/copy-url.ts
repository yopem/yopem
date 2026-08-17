import { toastManager } from "ui/toast"

export const handleCopyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    toastManager.add({
      title: "URL copied to clipboard",
      type: "success",
    })
  } catch {
    toastManager.add({
      title: "Failed to copy URL",
      type: "error",
    })
  }
}
