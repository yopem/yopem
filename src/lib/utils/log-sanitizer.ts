const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /Bearer\s+[a-zA-Z0-9_\-.]+/g,
  /api[_-]?key["\s:=]+[a-zA-Z0-9_\-.]+/gi,
  /token["\s:=]+[a-zA-Z0-9_\-.]+/gi,
  /jwt["\s:=]+[a-zA-Z0-9_\-.]+/gi,
  /password["\s:=]+[^\s"',}]+/gi,
  /[a-f0-9]{64,}/g,
]

export function sanitizeLogData(data: unknown): unknown {
  if (typeof data === "string") {
    return sanitizeString(data)
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData)
  }

  if (data && typeof data === "object") {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = "[REDACTED]"
      } else {
        sanitized[key] = sanitizeLogData(value)
      }
    }
    return sanitized
  }

  return data
}

function sanitizeString(str: string): string {
  let sanitized = str
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]")
  }
  return sanitized
}

function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase()
  return (
    lowerKey.includes("key") ||
    lowerKey.includes("token") ||
    lowerKey.includes("secret") ||
    lowerKey.includes("password") ||
    lowerKey.includes("auth") ||
    lowerKey.includes("credential") ||
    lowerKey.includes("cipher")
  )
}
