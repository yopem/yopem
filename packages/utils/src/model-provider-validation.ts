import type { ApiKeyProvider } from "utils/api-keys-schema"

export function findModelProvider(
  modelId: string,
  models: { modelId: string; provider: string }[],
): { modelId: string; provider: string } | undefined {
  return models.find((m) => m.modelId === modelId)
}

export function getProviderMismatchMessage(
  provider: string,
  modelId: string,
): string {
  return `Model "${modelId}" does not belong to provider "${provider}". Please select a model from the selected API key's provider.`
}

export function validateModelProviderMatch(
  provider: ApiKeyProvider,
  modelId: string,
  models: { modelId: string; provider: string }[],
): { valid: boolean; message?: string } {
  const modelEntry = findModelProvider(modelId, models)

  if (modelEntry && modelEntry.provider !== provider) {
    return {
      valid: false,
      message: getProviderMismatchMessage(provider, modelId),
    }
  }

  return { valid: true }
}
