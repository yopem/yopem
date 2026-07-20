"use client"

import { PlaceholderPlugin, UploadErrorCode } from "@platejs/media/react"
import { usePluginOption } from "platejs/react"
import { useEffect } from "react"

import { toastManager } from "ui/toast"

export function MediaUploadToast() {
  useUploadErrorToast()

  return null
}

const useUploadErrorToast = () => {
  const uploadError = usePluginOption(PlaceholderPlugin, "error")

  useEffect(() => {
    if (!uploadError) return

    const { code, data } = uploadError

    switch (code) {
      case UploadErrorCode.INVALID_FILE_SIZE: {
        toastManager.add({
          title: `The size of files ${data.files.map((f) => f.name).join(", ")} is invalid`,
          type: "error",
        })

        break
      }
      case UploadErrorCode.INVALID_FILE_TYPE: {
        toastManager.add({
          title: `The type of files ${data.files.map((f) => f.name).join(", ")} is invalid`,
          type: "error",
        })

        break
      }
      case UploadErrorCode.TOO_LARGE: {
        toastManager.add({
          title: `The size of files ${data.files.map((f) => f.name).join(", ")} is too large than ${data.maxFileSize}`,
          type: "error",
        })

        break
      }
      case UploadErrorCode.TOO_LESS_FILES: {
        toastManager.add({
          title: `The minimum number of files is ${data.minFileCount} for ${data.fileType}`,
          type: "error",
        })

        break
      }
      case UploadErrorCode.TOO_MANY_FILES: {
        toastManager.add({
          title: `The maximum number of files is ${data.maxFileCount} ${data.fileType ? `for ${data.fileType}` : ""}`,
          type: "error",
        })

        break
      }
    }
  }, [uploadError])
}
