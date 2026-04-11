import type { AIProvider, ExecutionResponse } from "./providers/base.ts"
import type { ApiKeyProvider } from "./providers/base.ts"
import type { AIProviderErrors } from "./providers/base.ts"

import { getR2Storage } from "../storage"
import { OpenAIProvider } from "./providers/openai.ts"
import { OpenRouterProvider } from "./providers/openrouter.ts"

export class UploadError extends Error {
  format: "image" | "video"
  override cause?: unknown

  constructor(format: "image" | "video", message: string, cause?: unknown) {
    super(message)
    this.name = "UploadError"
    this.format = format
    this.cause = cause
  }
}

export type AIExecutionError = AIProviderErrors | UploadError

interface ExecuteAIToolParams {
  systemRole: string
  userInstructionTemplate: string
  inputs: Record<string, unknown>
  config: {
    modelEngine: string
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
    case "openrouter":
      return new OpenRouterProvider({ apiKey, model })
  }
}

function wrapStorageError(format: "image" | "video", e: unknown): UploadError {
  return new UploadError(
    format,
    `Failed to upload ${format}: ${e instanceof Error ? e.message : "Unknown error"}`,
    e,
  )
}

async function doUpload(
  r2: ReturnType<typeof getR2Storage>,
  outputFormat: "image" | "video",
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  try {
    const url =
      outputFormat === "image"
        ? await r2.uploadImage(buffer, contentType)
        : await r2.uploadVideo(buffer, contentType)
    return url
  } catch (e) {
    throw wrapStorageError(outputFormat, e)
  }
}

async function uploadMediaOutput(
  output: string,
  outputFormat: "image" | "video",
  usage: ExecutionResponse["usage"],
): Promise<ExecutionResponse> {
  const base64Regex = /^data:([^;]+);base64,(.+)$/
  const base64Match = base64Regex.exec(output)

  if (base64Match) {
    const contentType = base64Match[1]
    const base64Data = base64Match[2]
    const buffer = Buffer.from(base64Data, "base64")
    const r2 = getR2Storage()
    const url = await doUpload(r2, outputFormat, buffer, contentType)
    return { output: url, usage }
  }

  if (output.startsWith("http://") || output.startsWith("https://")) {
    return { output, usage }
  }

  const buffer = Buffer.from(output, "utf8")
  const r2 = getR2Storage()
  const contentType = outputFormat === "image" ? "image/png" : "video/mp4"
  const url = await doUpload(r2, outputFormat, buffer, contentType)
  return { output: url, usage }
}

export async function executeAITool(
  params: ExecuteAIToolParams,
): Promise<ExecutionResponse> {
  const systemRole = replaceVariables(params.systemRole, params.inputs)
  const userInstruction = replaceVariables(
    params.userInstructionTemplate,
    params.inputs,
  )

  const maxOutputTokens = Math.min(
    4096,
    Math.max(512, Math.ceil((systemRole.length + userInstruction.length) / 4)),
  )

  const provider = getProviderInstance(
    params.provider,
    params.apiKey,
    params.config.modelEngine,
  )

  const response = await provider.execute({
    systemRole,
    userInstruction,
    maxOutputTokens,
    outputFormat: params.outputFormat,
  })

  if (params.outputFormat === "image" || params.outputFormat === "video") {
    return uploadMediaOutput(
      response.output,
      params.outputFormat,
      response.usage,
    )
  }

  return response
}
