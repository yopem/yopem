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

  private isReasoningModel(): boolean {
    const m = this.model.toLowerCase()
    return (
      m.startsWith("o1") ||
      m.startsWith("o3") ||
      m.startsWith("o4") ||
      m.includes("/o1") ||
      m.includes("/o3") ||
      m.includes("/o4")
    )
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    try {
      const result = await generateText({
        model: this.provider(this.model),
        system: request.systemRole,
        prompt: request.userInstruction,
        ...(this.isReasoningModel()
          ? {}
          : { temperature: request.temperature }),
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
        if (
          errorMessage.includes("context_length_exceeded") ||
          errorMessage.includes("context window") ||
          errorMessage.includes("maximum context length") ||
          errorMessage.includes("too many tokens")
        ) {
          throw new ContextLengthError("openrouter", error)
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
