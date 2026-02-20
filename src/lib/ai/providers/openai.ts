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
} from "./base"

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

  private isReasoningModel(): boolean {
    const m = this.model.toLowerCase()
    return (
      m.startsWith("o1") ||
      m.startsWith("o3") ||
      m.startsWith("o4") ||
      m.startsWith("gpt-5")
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
        usage: result.usage
          ? {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: result.usage.totalTokens ?? 0,
            }
          : undefined,
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (
          errorMessage.includes("401") ||
          errorMessage.includes("unauthorized")
        ) {
          throw new InvalidKeyError("openai", error)
        }
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate limit")
        ) {
          throw new RateLimitError("openai", error)
        }
        if (
          errorMessage.includes("context_length_exceeded") ||
          errorMessage.includes("context window") ||
          errorMessage.includes("maximum context length") ||
          errorMessage.includes("too many tokens")
        ) {
          throw new ContextLengthError("openai", error)
        }
        throw new AIProviderError(
          error.message ?? "OpenAI API error",
          "openai",
          error,
        )
      }
      throw new AIProviderError(
        "Unexpected error during OpenAI execution",
        "openai",
        error,
      )
    }
  }
}
