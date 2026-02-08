import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
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
          throw new InvalidKeyError("openrouter", error)
        }
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate limit")
        ) {
          throw new RateLimitError("openrouter", error)
        }
        throw new AIProviderError(
          error.message ?? "OpenRouter API error",
          "openrouter",
          error,
        )
      }
      throw new AIProviderError(
        "Unexpected error during OpenRouter execution",
        "openrouter",
        error,
      )
    }
  }
}
