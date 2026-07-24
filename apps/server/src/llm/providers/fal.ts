import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText } from "ai"

import {
  AIProviderError,
  ContextLengthError,
  InvalidKeyError,
  RateLimitError,
  type AIProvider,
  type ApiKeyProvider,
  type ExecutionRequest,
  type ExecutionResponse,
  type ProviderConfig,
} from "./base"

const FAL_OPENAI_COMPATIBLE_URL = "https://fal.run/openai-compatible/v1"
const FAL_API_BASE = "https://fal.run"
const MAX_POLL_RETRIES = 30
const POLL_INTERVAL_MS = 1000

export class FalProvider implements AIProvider {
  private openaiProvider: ReturnType<typeof createOpenAICompatible>
  private model: string
  private apiKey: string

  constructor(config: ProviderConfig) {
    this.openaiProvider = createOpenAICompatible({
      name: "fal",
      apiKey: config.apiKey,
      baseURL: FAL_OPENAI_COMPATIBLE_URL,
    })
    this.model = config.model
    this.apiKey = config.apiKey
  }

  execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    if (request.outputFormat === "image" || request.outputFormat === "video") {
      return this.executeMediaGeneration(request)
    }

    return this.executeTextGeneration(request)
  }

  private async executeTextGeneration(
    request: ExecutionRequest,
  ): Promise<ExecutionResponse> {
    try {
      const result = await generateText({
        model: this.openaiProvider(this.model),
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
      if (e instanceof Error) throw this.wrapError(e)
      throw new AIProviderError(
        "fal",
        "Unexpected error during FAL text execution",
        e,
      )
    }
  }

  private async executeMediaGeneration(
    request: ExecutionRequest,
  ): Promise<ExecutionResponse> {
    const input: Record<string, unknown> = {
      prompt: request.userInstruction,
    }
    if (request.systemRole) {
      input["system_prompt"] = request.systemRole
    }

    const response = await this.submitToFal(input)
    const data = await this.pollUntilComplete(response)
    const mediaUrl = this.extractMediaUrl(data)

    return {
      output: mediaUrl,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    }
  }

  private async submitToFal(
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${FAL_API_BASE}/${this.model}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        throw new AIProviderError(
          "fal",
          `FAL API returned ${response.status}: ${body || response.statusText}`,
        )
      }

      return (await response.json()) as Record<string, unknown>
    } catch (e) {
      if (e instanceof AIProviderError) throw e
      if (e instanceof Error) throw this.wrapError(e)
      throw new AIProviderError("fal", "Unexpected error submitting to FAL", e)
    }
  }

  private async pollUntilComplete(
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const status = data["status"] as string | undefined
    const responseUrl = data["response_url"] as string | undefined

    if (status === "COMPLETED" || this.hasMediaFields(data)) {
      return data
    }

    if ((!responseUrl && status === "IN_QUEUE") || status === "IN_PROGRESS") {
      throw new AIProviderError(
        "fal",
        "FAL request queued but no response URL provided",
      )
    }

    if (!responseUrl) {
      if (this.hasMediaFields(data)) return data
      throw new AIProviderError(
        "fal",
        `FAL returned status "${status ?? "unknown"}" with no result and no response URL`,
      )
    }

    for (let i = 0; i < MAX_POLL_RETRIES; i++) {
      await sleep(POLL_INTERVAL_MS)

      try {
        const res = await fetch(responseUrl, {
          headers: { Authorization: `Key ${this.apiKey}` },
        })

        if (!res.ok) {
          if (res.status === 404 && i < 3) continue
          throw new AIProviderError(
            "fal",
            `FAL poll returned ${res.status}: ${res.statusText}`,
          )
        }

        const result = (await res.json()) as Record<string, unknown>
        const resultStatus = result["status"] as string | undefined

        if (resultStatus === "COMPLETED" || this.hasMediaFields(result)) {
          return result
        }

        if (resultStatus === "ERROR") {
          const errMsg =
            (result["error"] as string) ??
            (result["error_message"] as string) ??
            "Unknown FAL error"
          throw new AIProviderError("fal", errMsg)
        }
      } catch (e) {
        if (e instanceof AIProviderError) throw e
        if (e instanceof Error) throw this.wrapError(e)
        throw e
      }
    }

    throw new AIProviderError(
      "fal",
      `FAL request timed out after ${(MAX_POLL_RETRIES * POLL_INTERVAL_MS) / 1000}s`,
    )
  }

  private hasMediaFields(data: Record<string, unknown>): boolean {
    return (
      data["images"] != null ||
      data["video"] != null ||
      data["videos"] != null ||
      data["image"] != null ||
      data["url"] != null ||
      data["output"] != null
    )
  }

  private extractMediaUrl(data: Record<string, unknown>): string {
    const images = data["images"]
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0]
      if (typeof first === "string") return first
      if (first && typeof first === "object" && "url" in first) {
        return String(first["url"])
      }
    }

    const video = data["video"]
    if (Array.isArray(video) && video.length > 0) {
      const first = video[0]
      if (typeof first === "string") return first
      if (first && typeof first === "object" && "url" in first) {
        return String(first["url"])
      }
    }

    const videos = data["videos"]
    if (Array.isArray(videos) && videos.length > 0) {
      const first = videos[0]
      if (typeof first === "string") return first
      if (first && typeof first === "object" && "url" in first) {
        return String(first["url"])
      }
    }

    const image = data["image"]
    if (typeof image === "string") return image
    if (image && typeof image === "object" && "url" in image) {
      return String(image["url"])
    }

    const videoItem = data["video"]
    if (typeof videoItem === "string") return videoItem
    if (videoItem && typeof videoItem === "object" && "url" in videoItem) {
      return String(videoItem["url"])
    }

    if (typeof data["url"] === "string") return data["url"]
    if (typeof data["output"] === "string") return data["output"]

    throw new AIProviderError("fal", "No media URL found in FAL API response")
  }

  private wrapError(e: Error): AIProviderError {
    const msg = e.message.toLowerCase()
    const provider: ApiKeyProvider = "fal"

    if (msg.includes("401") || msg.includes("unauthorized")) {
      return new InvalidKeyError(
        provider,
        "Invalid API key. Please check your credentials.",
        e,
      )
    }
    if (msg.includes("429") || msg.includes("rate limit")) {
      return new RateLimitError(
        provider,
        "Rate limit exceeded. Please try again later.",
        e,
      )
    }
    if (
      msg.includes("context_length_exceeded") ||
      msg.includes("context window") ||
      msg.includes("maximum context length") ||
      msg.includes("too many tokens")
    ) {
      return new ContextLengthError(
        provider,
        "Your input exceeds the context window of this model. Please adjust your input and try again.",
        e,
      )
    }
    return new AIProviderError(provider, e.message ?? "FAL API error", e)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
