import type { ApiKeyProvider } from "@/lib/schemas/api-keys"

export function getProviderForModel(
  modelEngine: string,
): ApiKeyProvider | null {
  const modelLower = modelEngine.toLowerCase()

  if (modelLower.includes("gpt")) {
    return "openai"
  }

  if (modelLower.includes("claude")) {
    return "anthropic"
  }

  if (modelLower.includes("gemini") || modelLower.includes("palm")) {
    return "google"
  }

  if (modelLower.includes("azure")) {
    return "azure"
  }

  if (modelLower.includes("mistral")) {
    return "mistral"
  }

  if (modelLower.includes("llama")) {
    return "openrouter"
  }

  return null
}

export function validateModelProviderMatch(
  modelEngine: string,
  apiKeyProvider: ApiKeyProvider,
): boolean {
  const requiredProvider = getProviderForModel(modelEngine)

  if (!requiredProvider) {
    return true
  }

  return requiredProvider === apiKeyProvider
}

export function getProviderMismatchMessage(
  modelEngine: string,
  apiKeyProvider: ApiKeyProvider,
): string {
  const requiredProvider = getProviderForModel(modelEngine)

  if (!requiredProvider) {
    return "Unable to determine the required provider for this model"
  }

  const providerNames: Record<ApiKeyProvider, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    azure: "Azure",
    openrouter: "OpenRouter",
    mistral: "Mistral",
    other: "Other",
  }

  return `The selected API key (${providerNames[apiKeyProvider]}) is not compatible with ${modelEngine}. Please select a ${providerNames[requiredProvider]} API key.`
}
