/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

import {
  AIProviderError,
  InvalidKeyError,
  RateLimitError,
  type AIProvider,
  type ExecutionRequest,
  type ExecutionResponse,
  type ProviderConfig,
} from "./base"

export class AnthropicProvider implements AIProvider {
  private provider: ReturnType<typeof createAnthropic>
  private model: string

  constructor(config: ProviderConfig) {
    this.provider = createAnthropic({
      apiKey: config.apiKey,
    })
    this.model = config.model
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    try {
      const result = await generateText({
        model: this.provider(this.model),
        system: request.systemRole,
        prompt: request.userInstruction,
        temperature: request.temperature,
      })

      return {
        output: result.text,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: result.usage?.totalTokens ?? 0,
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (
          errorMessage.includes("401") ||
          errorMessage.includes("unauthorized")
        ) {
          throw new InvalidKeyError("anthropic", error)
        }
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate limit")
        ) {
          throw new RateLimitError("anthropic", error)
        }
        throw new AIProviderError(
          error.message ?? "Anthropic API error",
          "anthropic",
          error,
        )
      }
      throw new AIProviderError(
        "Unexpected error during Anthropic execution",
        "anthropic",
        error,
      )
    }
  }
}
