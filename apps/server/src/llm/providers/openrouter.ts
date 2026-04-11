import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
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

export class OpenRouterProvider implements AIProvider {
  private provider: ReturnType<typeof createOpenAICompatible>
  private model: string

  constructor(config: ProviderConfig) {
    this.provider = createOpenAICompatible({
      name: "openrouter",
      apiKey: config.apiKey,
      baseURL: "https://openrouter.ai/api/v1",
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
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: result.usage?.totalTokens ?? 0,
        },
      }
    } catch (e) {
      if (e instanceof Error) {
        const msg = e.message.toLowerCase()
        if (msg.includes("401") || msg.includes("unauthorized")) {
          throw new InvalidKeyError(
            "openrouter",
            "Invalid API key. Please check your credentials.",
            e,
          )
        }
        if (msg.includes("429") || msg.includes("rate limit")) {
          throw new RateLimitError(
            "openrouter",
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
            "openrouter",
            "Your input exceeds the context window of this model. Please adjust your input and try again.",
            e,
          )
        }
        throw new AIProviderError(
          "openrouter",
          e.message ?? "OpenRouter API error",
          e,
        )
      }
      throw new AIProviderError(
        "openrouter",
        "Unexpected error during OpenRouter execution",
        e,
      )
    }
  }
}
