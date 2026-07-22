import type { ApiKeyProvider } from "utils/api-keys-schema"

interface TestKeyResult {
  valid: boolean
  error?: string
}

const VALIDATION_TIMEOUT_MS = 10000

function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = VALIDATION_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  )
}

function formatConnectionError(provider: string, error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return `${provider} validation timed out. Check your connection or enable "Skip validation".`
  }
  return `Connection to ${provider} failed: ${error instanceof Error ? error.message : String(error)}`
}

export function testApiKey(
  provider: ApiKeyProvider,
  apiKey: string,
): Promise<TestKeyResult> {
  switch (provider) {
    case "openai":
      return testOpenAI(apiKey)
    case "openrouter":
      return testOpenRouter(apiKey)
    case "fal":
      return testFal(apiKey)
  }
}

async function testOpenAI(apiKey: string): Promise<TestKeyResult> {
  try {
    const res = await fetchWithTimeout("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    })
    if (res.ok) return { valid: true }
    const body = await res.text().catch(() => "")
    if (res.status === 401) {
      return {
        valid: false,
        error:
          `Invalid OpenAI API key. ${body || "Check your key and try again."}`.trim(),
      }
    }
    return {
      valid: false,
      error:
        `OpenAI returned ${res.status} ${res.statusText}: ${body || "(no body)"}`.trim(),
    }
  } catch (e) {
    return {
      valid: false,
      error: formatConnectionError("OpenAI", e),
    }
  }
}

async function testOpenRouter(apiKey: string): Promise<TestKeyResult> {
  try {
    const res = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/auth/key",
      {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      },
    )
    if (res.ok) return { valid: true }
    const body = await res.text().catch(() => "")
    if (res.status === 401) {
      return {
        valid: false,
        error:
          `Invalid OpenRouter API key. ${body || "Check your key and try again."}`.trim(),
      }
    }
    return {
      valid: false,
      error:
        `OpenRouter returned ${res.status} ${res.statusText}: ${body || "(no body)"}`.trim(),
    }
  } catch (e) {
    return {
      valid: false,
      error: formatConnectionError("OpenRouter", e),
    }
  }
}

async function testFal(apiKey: string): Promise<TestKeyResult> {
  try {
    const res = await fetchWithTimeout(
      "https://fal.run/openai-compatible/v1/models",
      {
        headers: { Authorization: `Key ${apiKey.trim()}` },
      },
    )
    if (res.ok) return { valid: true }
    const body = await res.text().catch(() => "")
    if (res.status === 401) {
      return {
        valid: false,
        error:
          `Invalid fal.ai API key. ${body || "Check your key and try again."}`.trim(),
      }
    }
    return {
      valid: false,
      error:
        `fal.ai returned ${res.status} ${res.statusText}: ${body || "(no body)"}`.trim(),
    }
  } catch (e) {
    return {
      valid: false,
      error: formatConnectionError("fal.ai", e),
    }
  }
}
