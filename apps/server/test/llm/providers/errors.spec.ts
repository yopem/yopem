import { describe, expect, test } from "bun:test"
import {
  AIProviderError,
  ContextLengthError,
  InvalidKeyError,
  RateLimitError,
} from "server/llm/providers/base"
import { classifyProviderError } from "server/llm/providers/errors"

describe("classifyProviderError", () => {
  test("classifies 401 as InvalidKeyError", () => {
    const error = classifyProviderError(
      "openai",
      new Error("Authentication failed: 401 Unauthorized"),
      "fallback",
    )
    expect(error).toBeInstanceOf(InvalidKeyError)
    expect(error.provider).toBe("openai")
  })

  test("classifies rate limit as RateLimitError", () => {
    const error = classifyProviderError(
      "fal",
      new Error("Rate limit exceeded: 429"),
      "fallback",
    )
    expect(error).toBeInstanceOf(RateLimitError)
  })

  test("classifies context length as ContextLengthError", () => {
    const error = classifyProviderError(
      "openrouter",
      new Error("maximum context length exceeded"),
      "fallback",
    )
    expect(error).toBeInstanceOf(ContextLengthError)
  })

  test("falls back to AIProviderError for unknown errors", () => {
    const error = classifyProviderError(
      "openai",
      new Error("some other failure"),
      "openai API error",
    )
    expect(error).toBeInstanceOf(AIProviderError)
    expect(error.message).toBe("openai API error")
  })
})
