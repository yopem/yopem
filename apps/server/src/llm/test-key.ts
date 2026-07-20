import type { ApiKeyProvider } from "utils/api-keys-schema"

interface TestKeyResult {
  valid: boolean
  error?: string
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
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) return { valid: true }
    if (res.status === 401) {
      return { valid: false, error: "Invalid API key. Check your OpenAI key." }
    }
    return {
      valid: false,
      error: `OpenAI returned ${res.status}: ${res.statusText}`,
    }
  } catch (e) {
    return { valid: false, error: `Connection failed: ${String(e)}` }
  }
}

async function testOpenRouter(apiKey: string): Promise<TestKeyResult> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) return { valid: true }
    if (res.status === 401) {
      return {
        valid: false,
        error: "Invalid API key. Check your OpenRouter key.",
      }
    }
    return {
      valid: false,
      error: `OpenRouter returned ${res.status}: ${res.statusText}`,
    }
  } catch (e) {
    return { valid: false, error: `Connection failed: ${String(e)}` }
  }
}

async function testFal(apiKey: string): Promise<TestKeyResult> {
  try {
    const res = await fetch("https://fal.run/openai-compatible/v1/models", {
      headers: { Authorization: `Key ${apiKey}` },
    })
    if (res.ok) return { valid: true }
    if (res.status === 401) {
      return {
        valid: false,
        error: "Invalid API key. Check your fal.ai key.",
      }
    }
    return {
      valid: false,
      error: `fal.ai returned ${res.status}: ${res.statusText}`,
    }
  } catch (e) {
    return { valid: false, error: `Connection failed: ${String(e)}` }
  }
}
