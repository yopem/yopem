import {
  StorageDeleteError,
  StorageUploadError,
  StorageValidationError,
  getR2Storage,
} from "server/storage"
import { describe, expect, test } from "vitest"

describe("storage", () => {
  test("exports storage errors and singleton getter", () => {
    expect(StorageValidationError).toBeDefined()
    expect(StorageUploadError).toBeDefined()
    expect(StorageDeleteError).toBeDefined()
    expect(typeof getR2Storage).toBe("function")
  })
})
