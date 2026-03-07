import { createOpenAI } from "@ai-sdk/openai"
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
          usage: result.usage
            ? {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: result.usage.totalTokens ?? 0,
              }
            : undefined,
        }
      },
      catch: (e) => {
        if (e instanceof Error) {
          const msg = e.message.toLowerCase()
          if (msg.includes("401") || msg.includes("unauthorized")) {
            return new InvalidKeyError({
              provider: "openai",
              message: "Invalid API key. Please check your credentials.",
              cause: e,
            })
          }
          if (msg.includes("429") || msg.includes("rate limit")) {
            return new RateLimitError({
              provider: "openai",
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
              provider: "openai",
              message:
                "Your input exceeds the context window of this model. Please adjust your input and try again.",
              cause: e,
            })
          }
          return new AIProviderError({
            provider: "openai",
            message: e.message ?? "OpenAI API error",
            cause: e,
          })
        }
        return new AIProviderError({
          provider: "openai",
          message: "Unexpected error during OpenAI execution",
          cause: e,
        })
      },
    })
  }
}
