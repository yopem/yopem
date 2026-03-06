import { TaggedError } from "better-result"
import type { Result } from "better-result"

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

export class RateLimitError extends TaggedError("RateLimitError")<{
  provider: ApiKeyProvider
  message: string
  cause?: unknown
}>() {}

export class InvalidKeyError extends TaggedError("InvalidKeyError")<{
  provider: ApiKeyProvider
  message: string
  cause?: unknown
}>() {}

export class ContextLengthError extends TaggedError("ContextLengthError")<{
  provider: ApiKeyProvider
  message: string
  cause?: unknown
}>() {}

export class AIProviderError extends TaggedError("AIProviderError")<{
  provider: ApiKeyProvider
  message: string
  cause?: unknown
}>() {}

export type AIProviderErrors =
  | RateLimitError
  | InvalidKeyError
  | ContextLengthError
  | AIProviderError

export interface AIProvider {
  execute(
    request: ExecutionRequest,
  ): Promise<Result<ExecutionResponse, AIProviderErrors>>
}
