import { describe, expect, test } from "bun:test"

describe("crypto utils", () => {
  test("encrypt and decrypt roundtrip", async () => {
    process.env.API_KEY_ENCRYPTION_SECRET = "test-secret-key"
    const { encryptApiKey, decryptApiKey } = await import("server/utils/crypto")
    const plaintext = "sk-1234567890"
    const encrypted = encryptApiKey(plaintext)
    expect(encrypted).toContain(":")
    expect(decryptApiKey(encrypted)).toBe(plaintext)
  })
})
