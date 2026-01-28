import type { ApiKeyProvider } from "@/lib/schemas/api-keys"
import { AnthropicProvider } from "./providers/anthropic"
import { AzureProvider } from "./providers/azure"
import type { AIProvider, ExecutionResponse } from "./providers/base"
import { GoogleProvider } from "./providers/google"
import { MistralProvider } from "./providers/mistral"
import { OpenAIProvider } from "./providers/openai"
import { OpenRouterProvider } from "./providers/openrouter"

interface ExecuteAIToolParams {
  systemRole: string
  userInstructionTemplate: string
  inputs: Record<string, unknown>
  config: {
    modelEngine: string
    temperature: number
    maxTokens: number
  }
  outputFormat: "plain" | "json"
  apiKey: string
  provider: ApiKeyProvider
}

function replaceVariables(
  template: string,
  inputs: Record<string, unknown>,
): string {
  let result = template
  for (const [key, value] of Object.entries(inputs)) {
    const placeholder = `{{${key}}}`
    result = result.replaceAll(placeholder, String(value))
  }
  return result
}

function getProviderInstance(
  provider: ApiKeyProvider,
  apiKey: string,
  model: string,
): AIProvider {
  switch (provider) {
    case "openai":
      return new OpenAIProvider({ apiKey, model })
    case "anthropic":
      return new AnthropicProvider({ apiKey, model })
    case "google":
      return new GoogleProvider({ apiKey, model })
    case "azure":
      return new AzureProvider({ apiKey, model })
    case "openrouter":
      return new OpenRouterProvider({ apiKey, model })
    case "mistral":
      return new MistralProvider({ apiKey, model })
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

export async function executeAITool(
  params: ExecuteAIToolParams,
): Promise<ExecutionResponse> {
  const systemRole = replaceVariables(params.systemRole, params.inputs)
  const userInstruction = replaceVariables(
    params.userInstructionTemplate,
    params.inputs,
  )

  const provider = getProviderInstance(
    params.provider,
    params.apiKey,
    params.config.modelEngine,
  )

  try {
    const response = await provider.execute({
      systemRole,
      userInstruction,
      temperature: params.config.temperature,
      maxTokens: params.config.maxTokens,
      outputFormat: params.outputFormat,
    })

    return response
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Unknown error during AI execution")
  }
}
