import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { Result } from "better-result"

import { generateText } from "ai"

import {
  AIProviderError,
  ContextLengthError,
  InvalidKeyError,
  RateLimitError,
  type AIProvider,
  type AIProviderErrors,
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

  execute(
    request: ExecutionRequest,
  ): Promise<Result<ExecutionResponse, AIProviderErrors>> {
    return Result.tryPromise({
      try: async () => {
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
      },
      catch: (e) => {
        if (e instanceof Error) {
          const msg = e.message.toLowerCase()
          if (msg.includes("401") || msg.includes("unauthorized")) {
            return new InvalidKeyError({
              provider: "openrouter",
              message: "Invalid API key. Please check your credentials.",
              cause: e,
            })
          }
          if (msg.includes("429") || msg.includes("rate limit")) {
            return new RateLimitError({
              provider: "openrouter",
              message: "Rate limit exceeded. Please try again later.",
              cause: e,
            })
          }
          if (
            msg.includes("context_length_exceeded") ||
            msg.includes("context window") ||
            msg.includes("maximum context length") ||
            msg.includes("too many tokens")
          ) {
            return new ContextLengthError({
              provider: "openrouter",
              message:
                "Your input exceeds the context window of this model. Please adjust your input and try again.",
              cause: e,
            })
          }
          return new AIProviderError({
            provider: "openrouter",
            message: e.message ?? "OpenRouter API error",
            cause: e,
          })
        }
        return new AIProviderError({
          provider: "openrouter",
          message: "Unexpected error during OpenRouter execution",
          cause: e,
        })
      },
    })
  }
}
