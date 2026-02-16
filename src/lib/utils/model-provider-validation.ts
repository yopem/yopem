import type { ApiKeyProvider } from "@/lib/schemas/api-keys"

export function getProviderForModel(
  modelEngine: string,
): ApiKeyProvider | null {
  const modelLower = modelEngine.toLowerCase()

  if (modelLower.includes("gpt")) {
    return "openai"
  }

  if (modelLower.includes("llama") || modelLower.includes("openrouter")) {
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
    openrouter: "OpenRouter",
  }

  return `The selected API key (${providerNames[apiKeyProvider]}) is not compatible with ${modelEngine}. Please select a ${providerNames[requiredProvider]} API key.`
}
