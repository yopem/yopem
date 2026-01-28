import type { ApiKeyProvider } from "@/lib/schemas/api-keys"

export interface ExecutionRequest {
  systemRole: string
  userInstruction: string
  temperature: number
  maxTokens: number
  outputFormat: "plain" | "json" | "image" | "video"
}

export interface ExecutionResponse {
  output: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ProviderConfig {
  apiKey: string
  model: string
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: ApiKeyProvider,
    public originalError?: unknown,
  ) {
    super(message)
    this.name = "AIProviderError"
  }
}

export class RateLimitError extends AIProviderError {
  constructor(provider: ApiKeyProvider, originalError?: unknown) {
    super(
      "Rate limit exceeded. Please try again later.",
      provider,
      originalError,
    )
    this.name = "RateLimitError"
  }
}

export class InvalidKeyError extends AIProviderError {
  constructor(provider: ApiKeyProvider, originalError?: unknown) {
    super(
      "Invalid API key. Please check your credentials.",
      provider,
      originalError,
    )
    this.name = "InvalidKeyError"
  }
}

export interface AIProvider {
  execute(request: ExecutionRequest): Promise<ExecutionResponse>
}
