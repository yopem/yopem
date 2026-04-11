export type ApiKeyProvider = "openai" | "openrouter"

export interface ExecutionRequest {
  systemRole: string
  userInstruction: string
  maxOutputTokens: number
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

export class RateLimitError extends Error {
  provider: ApiKeyProvider
  override cause?: unknown

  constructor(provider: ApiKeyProvider, message: string, cause?: unknown) {
    super(message)
    this.name = "RateLimitError"
    this.provider = provider
    this.cause = cause
  }
}

export class InvalidKeyError extends Error {
  provider: ApiKeyProvider
  override cause?: unknown

  constructor(provider: ApiKeyProvider, message: string, cause?: unknown) {
    super(message)
    this.name = "InvalidKeyError"
    this.provider = provider
    this.cause = cause
  }
}

export class ContextLengthError extends Error {
  provider: ApiKeyProvider
  override cause?: unknown

  constructor(provider: ApiKeyProvider, message: string, cause?: unknown) {
    super(message)
    this.name = "ContextLengthError"
    this.provider = provider
    this.cause = cause
  }
}

export class AIProviderError extends Error {
  provider: ApiKeyProvider
  override cause?: unknown

  constructor(provider: ApiKeyProvider, message: string, cause?: unknown) {
    super(message)
    this.name = "AIProviderError"
    this.provider = provider
    this.cause = cause
  }
}

export type AIProviderErrors =
  | RateLimitError
  | InvalidKeyError
  | ContextLengthError
  | AIProviderError

export interface AIProvider {
  execute(request: ExecutionRequest): Promise<ExecutionResponse>
}
