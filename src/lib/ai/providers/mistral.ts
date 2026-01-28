/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { createMistral } from "@ai-sdk/mistral"
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

export class MistralProvider implements AIProvider {
  private provider: ReturnType<typeof createMistral>
  private model: string

  constructor(config: ProviderConfig) {
    this.provider = createMistral({
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
          throw new InvalidKeyError("mistral", error)
        }
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate limit")
        ) {
          throw new RateLimitError("mistral", error)
        }
        throw new AIProviderError(
          error.message ?? "Mistral API error",
          "mistral",
          error,
        )
      }
      throw new AIProviderError(
        "Unexpected error during Mistral execution",
        "mistral",
        error,
      )
    }
  }
}
