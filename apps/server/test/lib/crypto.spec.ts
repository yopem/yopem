import { describe, expect, test } from "bun:test"

describe("crypto utils", () => {
  test("encrypt and decrypt roundtrip", async () => {
    process.env.API_KEY_ENCRYPTION_SECRET = "test-secret-key"
    const { encryptApiKey, decryptApiKey } = await import("server/lib/crypto")
    const plaintext = "sk-1234567890"
    const encrypted = encryptApiKey(plaintext)
    expect(encrypted).toContain(":")
    expect(decryptApiKey(encrypted)).toBe(plaintext)
  })

  test("maskApiKeyConfig masks the decrypted key", async () => {
    process.env.API_KEY_ENCRYPTION_SECRET = "test-secret-key"
    const { encryptApiKey, maskApiKeyConfig } =
      await import("server/lib/crypto")
    const config = {
      id: "k_1",
      provider: "openai" as const,
      name: "Test",
      apiKey: encryptApiKey("sk-1234567890"),
      status: "active" as const,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }
    const masked = maskApiKeyConfig(config)
    expect(masked.apiKey).toContain("sk-1234")
    expect(masked.apiKey).not.toContain("7890")
    expect(masked.id).toBe("k_1")
  })

  test("maskApiKeyConfig throws on malformed ciphertext", async () => {
    process.env.API_KEY_ENCRYPTION_SECRET = "test-secret-key"
    const { maskApiKeyConfig } = await import("server/lib/crypto")
    const config = {
      id: "k_1",
      provider: "openai" as const,
      name: "Test",
      apiKey: "not-valid-ciphertext",
      status: "active" as const,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }
    expect(() => maskApiKeyConfig(config)).toThrow()
  })
})
