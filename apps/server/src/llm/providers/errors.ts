import type { ApiKeyProvider } from "./base"

import {
  AIProviderError,
  ContextLengthError,
  InvalidKeyError,
  RateLimitError,
} from "./base"

export function classifyProviderError(
  provider: ApiKeyProvider,
  error: Error,
  fallbackMessage: string,
): AIProviderError {
  const message = error.message.toLowerCase()

  if (
    message.includes("401") ||
    message.includes("unauthorized") ||
    message.includes("missing authentication")
  ) {
    return new InvalidKeyError(
      provider,
      "Invalid or missing API key. Please check your credentials.",
      error,
    )
  }

  if (message.includes("429") || message.includes("rate limit")) {
    return new RateLimitError(
      provider,
      "Rate limit exceeded. Please try again later.",
      error,
    )
  }

  if (
    message.includes("context_length_exceeded") ||
    message.includes("context window") ||
    message.includes("maximum context length") ||
    message.includes("too many tokens")
  ) {
    return new ContextLengthError(
      provider,
      "Your input exceeds the context window of this model. Please adjust your input and try again.",
      error,
    )
  }

  return new AIProviderError(provider, fallbackMessage, error)
}
