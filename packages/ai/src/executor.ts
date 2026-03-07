import { Result, TaggedError } from "better-result"
import { getR2Storage } from "~storage"

import type { AIProvider, ExecutionResponse } from "./providers/base"
import type { ApiKeyProvider } from "./providers/base"
import type { AIProviderErrors } from "./providers/base"

import { OpenAIProvider } from "./providers/openai"
import { OpenRouterProvider } from "./providers/openrouter"

export class UploadError extends TaggedError("UploadError")<{
  format: "image" | "video"
  message: string
  cause?: unknown
}>() {}

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
  return new UploadError({
    format,
    message: `Failed to upload ${format}: ${e instanceof Error ? e.message : "Unknown error"}`,
    cause: e,
  })
}

async function doUpload(
  r2: ReturnType<typeof getR2Storage>,
  outputFormat: "image" | "video",
  buffer: Buffer,
  contentType: string,
): Promise<Result<string, UploadError>> {
  const uploadResult =
    outputFormat === "image"
      ? await r2.uploadImage(buffer, contentType)
      : await r2.uploadVideo(buffer, contentType)
  return uploadResult.mapError((e) => wrapStorageError(outputFormat, e))
}

async function uploadMediaOutput(
  output: string,
  outputFormat: "image" | "video",
  usage: ExecutionResponse["usage"],
): Promise<Result<ExecutionResponse, UploadError>> {
  const base64Regex = /^data:([^;]+);base64,(.+)$/
  const base64Match = base64Regex.exec(output)

  if (base64Match) {
    const contentType = base64Match[1]
    const base64Data = base64Match[2]
    const buffer = Buffer.from(base64Data, "base64")
    const r2 = getR2Storage()
    const urlResult = await doUpload(r2, outputFormat, buffer, contentType)
    if (Result.isError(urlResult)) return urlResult
    return Result.ok({ output: urlResult.value, usage })
  }

  if (output.startsWith("http://") || output.startsWith("https://")) {
    return Result.ok({ output, usage })
  }

  const buffer = Buffer.from(output, "utf8")
  const r2 = getR2Storage()
  const contentType = outputFormat === "image" ? "image/png" : "video/mp4"
  const urlResult = await doUpload(r2, outputFormat, buffer, contentType)
  if (Result.isError(urlResult)) return urlResult
  return Result.ok({ output: urlResult.value, usage })
}

export function executeAITool(
  params: ExecuteAIToolParams,
): Promise<Result<ExecutionResponse, AIExecutionError>> {
  return Result.gen(async function* () {
    const systemRole = replaceVariables(params.systemRole, params.inputs)
    const userInstruction = replaceVariables(
      params.userInstructionTemplate,
      params.inputs,
    )

    const maxOutputTokens = Math.min(
      4096,
      Math.max(
        512,
        Math.ceil((systemRole.length + userInstruction.length) / 4),
      ),
    )

    const provider = getProviderInstance(
      params.provider,
      params.apiKey,
      params.config.modelEngine,
    )

    const response = yield* await provider.execute({
      systemRole,
      userInstruction,
      maxOutputTokens,
      outputFormat: params.outputFormat,
    })

    if (params.outputFormat === "image" || params.outputFormat === "video") {
      const uploaded = yield* await uploadMediaOutput(
        response.output,
        params.outputFormat,
        response.usage,
      )
      return Result.ok(uploaded)
    }

    return Result.ok(response)
  })
}
