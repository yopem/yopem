import { getR2Storage } from "server/storage/r2"

import type { AIProvider, ExecutionResponse } from "./providers/base"
import type { ApiKeyProvider } from "./providers/base"
import type { AIProviderErrors } from "./providers/base"

import { FalProvider } from "./providers/fal"
import { OpenAICompatibleProvider } from "./providers/openai-compatible"

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

type MediaFormat = "image" | "video"
type OutputFormat = "plain" | "json" | MediaFormat

interface ExecuteAIProductParams {
  systemRole: string
  userInstructionTemplate: string
  config: {
    modelEngine: string
  }
  outputFormat: OutputFormat
  apiKey: string
  provider: ApiKeyProvider
}

function getProviderInstance(
  provider: ApiKeyProvider,
  apiKey: string,
  model: string,
): AIProvider {
  switch (provider) {
    case "openai":
      return new OpenAICompatibleProvider({
        name: "openai",
        apiKey,
        model,
        baseURL: "https://api.openai.com/v1",
      })
    case "openrouter":
      return new OpenAICompatibleProvider({
        name: "openrouter",
        apiKey,
        model,
        baseURL: "https://openrouter.ai/api/v1",
      })
    case "fal":
      return new FalProvider({ apiKey, model })
  }
}

async function uploadMediaOutput(
  output: string,
  outputFormat: MediaFormat,
  usage: ExecutionResponse["usage"],
): Promise<ExecutionResponse> {
  const r2 = getR2Storage()

  const upload = async (
    uploadFn: (buffer: Buffer, contentType: string) => Promise<string>,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> => {
    try {
      return await uploadFn(buffer, contentType)
    } catch (e) {
      throw new UploadError(
        outputFormat,
        `Failed to upload ${outputFormat}: ${e instanceof Error ? e.message : "Unknown error"}`,
        e,
      )
    }
  }

  const base64Match = /^data:([^;]+);base64,(.+)$/.exec(output)
  if (base64Match) {
    const contentType = base64Match[1]
    const buffer = Buffer.from(base64Match[2], "base64")
    const url = await upload(r2.uploadImage.bind(r2), buffer, contentType)
    return { output: url, usage }
  }

  if (output.startsWith("http://") || output.startsWith("https://")) {
    return { output, usage }
  }

  const buffer = Buffer.from(output, "utf8")
  const contentType = outputFormat === "image" ? "image/png" : "video/mp4"
  const uploadFn =
    outputFormat === "image" ? r2.uploadImage.bind(r2) : r2.uploadVideo.bind(r2)
  const url = await upload(uploadFn, buffer, contentType)
  return { output: url, usage }
}

export async function executeAIProduct(
  params: ExecuteAIProductParams,
): Promise<ExecutionResponse> {
  const systemRole = params.systemRole
  const userInstruction = params.userInstructionTemplate

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
