import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

import {
  AIProviderError,
  ContextLengthError,
  InvalidKeyError,
  RateLimitError,
  type AIProvider,
  type ExecutionRequest,
  type ExecutionResponse,
  type ProviderConfig,
} from "./base.ts"

export class OpenAIProvider implements AIProvider {
  private provider: ReturnType<typeof createOpenAI>
  private model: string

  constructor(config: ProviderConfig) {
    this.provider = createOpenAI({
      apiKey: config.apiKey,
      baseURL: "https://api.openai.com/v1",
    })
    this.model = config.model
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
        usage: result.usage
          ? {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: result.usage.totalTokens ?? 0,
            }
          : undefined,
      }
    } catch (e) {
      if (e instanceof Error) {
        const msg = e.message.toLowerCase()
        if (msg.includes("401") || msg.includes("unauthorized")) {
          throw new InvalidKeyError(
            "openai",
            "Invalid API key. Please check your credentials.",
            e,
          )
        }
        if (msg.includes("429") || msg.includes("rate limit")) {
          throw new RateLimitError(
            "openai",
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
            "openai",
            "Your input exceeds the context window of this model. Please adjust your input and try again.",
            e,
          )
        }
        throw new AIProviderError("openai", e.message ?? "OpenAI API error", e)
      }
      throw new AIProviderError(
        "openai",
        "Unexpected error during OpenAI execution",
        e,
      )
    }
  }
}
