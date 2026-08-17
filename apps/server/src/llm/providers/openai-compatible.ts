import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText } from "ai"

import {
  AIProviderError,
  type AIProvider,
  type ApiKeyProvider,
  type ExecutionRequest,
  type ExecutionResponse,
} from "./base"
import { classifyProviderError } from "./errors"

interface OpenAICompatibleConfig {
  name: string
  baseURL: string
  apiKey: string
  model: string
}

export class OpenAICompatibleProvider implements AIProvider {
  private provider: ReturnType<typeof createOpenAICompatible>
  private model: string
  private providerName: ApiKeyProvider

  constructor(config: OpenAICompatibleConfig) {
    this.provider = createOpenAICompatible({
      name: config.name,
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })
    this.model = config.model
    this.providerName = config.name as ApiKeyProvider
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
        throw classifyProviderError(
          this.providerName,
          e,
          e.message ?? `${this.providerName} API error`,
        )
      }
      throw new AIProviderError(
        this.providerName,
        `Unexpected error during ${this.providerName} execution`,
        e,
      )
    }
  }
}
