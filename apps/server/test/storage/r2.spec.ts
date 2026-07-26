import { StorageValidationError } from "server/storage/r2"
import { describe, expect, test } from "vitest"

describe("R2Storage validation", () => {
  test("StorageValidationError has correct name", () => {
    const error = new StorageValidationError("bad file")
    expect(error.name).toBe("StorageValidationError")
    expect(error.message).toBe("bad file")
  })
})
