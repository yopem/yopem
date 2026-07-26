import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test"

describe("crypto utils", () => {
  beforeEach(() => {
    vi.stubEnv("API_KEY_ENCRYPTION_SECRET", "test-secret-key")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test("encrypt and decrypt roundtrip", async () => {
    const { encryptApiKey, decryptApiKey } = await import("server/utils/crypto")
    const plaintext = "sk-1234567890"
    const encrypted = encryptApiKey(plaintext)
    expect(encrypted).toContain(":")
    expect(decryptApiKey(encrypted)).toBe(plaintext)
  })
})
