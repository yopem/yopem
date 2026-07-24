import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText } from "ai"

import {
  AIProviderError,
  ContextLengthError,
  InvalidKeyError,
  RateLimitError,
  type AIProvider,
  type ApiKeyProvider,
  type ExecutionRequest,
  type ExecutionResponse,
} from "./base"

interface OpenAICompatibleConfig {
  name: string
  baseURL: string
  apiKey: string
  model: string
}

export class OpenAICompatibleProvider implements AIProvider {
  private provider: ReturnType<typeof createOpenAICompatible>
  private model: string
  private providerName: ApiKeyProvider

  constructor(config: OpenAICompatibleConfig) {
    this.provider = createOpenAICompatible({
      name: config.name,
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })
    this.model = config.model
    this.providerName = config.name as ApiKeyProvider
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    try {
      const result = await generateText({
        model: this.provider(this.model),
        system: request.systemRole,
        prompt: request.userInstruction,
        maxOutputTokens: request.maxOutputTokens,
      })

      return {
        output: result.text,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: result.usage?.totalTokens ?? 0,
        },
      }
    } catch (e) {
      if (e instanceof Error) {
        const msg = e.message.toLowerCase()
        if (
          msg.includes("401") ||
          msg.includes("unauthorized") ||
          msg.includes("missing authentication")
        ) {
          throw new InvalidKeyError(
            this.providerName,
            "Invalid or missing API key. Please check your credentials.",
            e,
          )
        }
        if (msg.includes("429") || msg.includes("rate limit")) {
          throw new RateLimitError(
            this.providerName,
            "Rate limit exceeded. Please try again later.",
            e,
          )
        }
        if (
          msg.includes("context_length_exceeded") ||
          msg.includes("context window") ||
          msg.includes("maximum context length") ||
          msg.includes("too many tokens")
        ) {
          throw new ContextLengthError(
            this.providerName,
            "Your input exceeds the context window of this model. Please adjust your input and try again.",
            e,
          )
        }
        throw new AIProviderError(
          this.providerName,
          e.message ?? `${this.providerName} API error`,
          e,
        )
      }
      throw new AIProviderError(
        this.providerName,
        `Unexpected error during ${this.providerName} execution`,
        e,
      )
    }
  }
}
