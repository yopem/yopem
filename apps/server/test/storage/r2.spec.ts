import { describe, expect, test } from "bun:test"
import {
  StorageDeleteError,
  StorageUploadError,
  StorageValidationError,
  getR2Storage,
} from "server/storage/r2"

describe("R2Storage validation", () => {
  test("StorageValidationError has correct name", () => {
    const error = new StorageValidationError("bad file")
    expect(error.name).toBe("StorageValidationError")
    expect(error.message).toBe("bad file")
  })

  test("exports storage errors and singleton getter", () => {
    expect(StorageValidationError).toBeDefined()
    expect(StorageUploadError).toBeDefined()
    expect(StorageDeleteError).toBeDefined()
    expect(typeof getR2Storage).toBe("function")
  })
})
