import type { ApiKeyProvider } from "@/lib/schemas/api-keys"
import { getR2Storage } from "@/lib/storage/r2"

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
  outputFormat: "plain" | "json" | "image" | "video"
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

    if (params.outputFormat === "image" || params.outputFormat === "video") {
      const output = response.output

      const base64Regex = /^data:([^;]+);base64,(.+)$/
      const base64Match = base64Regex.exec(output)
      if (base64Match) {
        const contentType = base64Match[1]
        const base64Data = base64Match[2]
        const buffer = Buffer.from(base64Data, "base64")

        const r2 = getR2Storage()

        let publicUrl: string
        if (params.outputFormat === "image") {
          publicUrl = await r2.uploadImage(buffer, contentType)
        } else {
          publicUrl = await r2.uploadVideo(buffer, contentType)
        }

        return {
          output: publicUrl,
          usage: response.usage,
        }
      }

      if (output.startsWith("http://") || output.startsWith("https://")) {
        return response
      }

      try {
        const buffer = Buffer.from(output, "utf8")
        const r2 = getR2Storage()

        let publicUrl: string
        const contentType =
          params.outputFormat === "image" ? "image/png" : "video/mp4"

        if (params.outputFormat === "image") {
          publicUrl = await r2.uploadImage(buffer, contentType)
        } else {
          publicUrl = await r2.uploadVideo(buffer, contentType)
        }

        return {
          output: publicUrl,
          usage: response.usage,
        }
      } catch (uploadError) {
        throw new Error(
          `Failed to upload ${params.outputFormat}: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
        )
      }
    }

    return response
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Unknown error during AI execution")
  }
}
