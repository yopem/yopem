import { Result, TaggedError } from "better-result"
import crypto from "crypto"

import { env } from "env"

export class EncryptionError extends TaggedError("EncryptionError")<{
  message: string
  cause?: unknown
}>() {}

export class DecryptionError extends TaggedError("DecryptionError")<{
  message: string
  cause?: unknown
}>() {}

function getEncryptionKey(): Buffer {
  const key = env.API_KEY_ENCRYPTION_SECRET
  return crypto.createHash("sha256").update(key).digest()
}

export function encryptApiKey(
  plaintext: string,
): Result<string, EncryptionError> {
  return Result.try({
    try: () => {
      const key = getEncryptionKey()
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
      let encrypted = cipher.update(plaintext, "utf8", "base64")
      encrypted += cipher.final("base64")
      const authTag = cipher.getAuthTag()
      return `${iv.toString("base64")}:${encrypted}:${authTag.toString("base64")}`
    },
    catch: (e) =>
      new EncryptionError({
        message: "Failed to encrypt API key",
        cause: e,
      }),
  })
}

export function decryptApiKey(
  ciphertext: string,
): Result<string, DecryptionError> {
  return Result.try({
    try: () => {
      const key = getEncryptionKey()
      const parts = ciphertext.split(":")
      if (parts.length !== 3) {
        throw new DecryptionError({
          message: `Invalid encrypted data format. Parts: ${parts.length}`,
        })
      }
      const [ivBase64, encryptedBase64, authTagBase64] = parts
      const iv = Buffer.from(ivBase64, "base64")
      const encrypted = Buffer.from(encryptedBase64, "base64")
      const authTag = Buffer.from(authTagBase64, "base64")
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
      decipher.setAuthTag(authTag)
      let decrypted = decipher.update(encrypted, undefined, "utf8")
      decrypted += decipher.final("utf8")
      return decrypted
    },
    catch: (e) => {
      if (DecryptionError.is(e)) return e
      return new DecryptionError({
        message: "Failed to decrypt API key",
        cause: e,
      })
    },
  })
}

export function maskApiKey(apiKey: string, visibleChars = 7): string {
  if (!apiKey || apiKey.length <= visibleChars) {
    return "****"
  }
  const visible = apiKey.substring(0, visibleChars)
  const masked = "*".repeat(Math.min(20, apiKey.length - visibleChars))
  return `${visible}${masked}`
}
