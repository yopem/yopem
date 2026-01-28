/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { createAzure } from "@ai-sdk/azure"
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

export class AzureProvider implements AIProvider {
  private provider: ReturnType<typeof createAzure>
  private model: string

  constructor(config: ProviderConfig) {
    this.provider = createAzure({
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
          throw new InvalidKeyError("azure", error)
        }
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate limit")
        ) {
          throw new RateLimitError("azure", error)
        }
        throw new AIProviderError(
          error.message ?? "Azure API error",
          "azure",
          error,
        )
      }
      throw new AIProviderError(
        "Unexpected error during Azure execution",
        "azure",
        error,
      )
    }
  }
}
