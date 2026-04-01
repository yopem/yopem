import { TaggedError } from "better-result"

export class CategoryNotFoundError extends TaggedError(
  "CategoryNotFoundError",
)<{
  categoryId: string
  message: string
}>() {
  constructor(args: { categoryId: string }) {
    super({
      ...args,
      message: `Category not found: ${args.categoryId}`,
    })
  }
}

export class CategoryValidationError extends TaggedError(
  "CategoryValidationError",
)<{
  message: string
}>() {
  constructor(args: { message: string }) {
    super(args)
  }
}

export class TagNotFoundError extends TaggedError("TagNotFoundError")<{
  tagId: string
  message: string
}>() {
  constructor(args: { tagId: string }) {
    super({
      ...args,
      message: `Tag not found: ${args.tagId}`,
    })
  }
}

export class TagValidationError extends TaggedError("TagValidationError")<{
  message: string
}>() {
  constructor(args: { message: string }) {
    super(args)
  }
}

export class ToolNotFoundError extends TaggedError("ToolNotFoundError")<{
  toolId?: string
  slug?: string
  message: string
}>() {
  constructor(args: { toolId?: string; slug?: string }) {
    super({
      ...args,
      message: args.toolId
        ? `Tool not found: ${args.toolId}`
        : `Tool not found: ${args.slug}`,
    })
  }
}

export class ToolValidationError extends TaggedError("ToolValidationError")<{
  field?: string
  message: string
}>() {
  constructor(args: { field?: string; message: string }) {
    super(args)
  }
}

export class ToolConfigurationError extends TaggedError(
  "ToolConfigurationError",
)<{
  toolId?: string
  message: string
}>() {
  constructor(args: { toolId?: string; message: string }) {
    super(args)
  }
}

export class ReviewNotFoundError extends TaggedError("ReviewNotFoundError")<{
  reviewId: string
  message: string
}>() {
  constructor(args: { reviewId: string }) {
    super({
      ...args,
      message: `Review not found: ${args.reviewId}`,
    })
  }
}

export class ReviewValidationError extends TaggedError(
  "ReviewValidationError",
)<{
  message: string
}>() {
  constructor(args: { message: string }) {
    super(args)
  }
}

export class AssetNotFoundError extends TaggedError("AssetNotFoundError")<{
  assetId: string
  message: string
}>() {
  constructor(args: { assetId: string }) {
    super({
      ...args,
      message: `Asset not found: ${args.assetId}`,
    })
  }
}

export class AssetValidationError extends TaggedError("AssetValidationError")<{
  message: string
}>() {
  constructor(args: { message: string }) {
    super(args)
  }
}

export class ApiKeyNotFoundError extends TaggedError("ApiKeyNotFoundError")<{
  keyId?: string
  message: string
}>() {
  constructor(args: { keyId?: string; message?: string }) {
    super({
      keyId: args.keyId,
      message:
        args.message ??
        (args.keyId ? `API key not found: ${args.keyId}` : "No API keys found"),
    })
  }
}

export class ApiKeyValidationError extends TaggedError(
  "ApiKeyValidationError",
)<{
  message: string
}>() {
  constructor(args: { message: string }) {
    super(args)
  }
}

export class RateLimitExceededError extends TaggedError(
  "RateLimitExceededError",
)<{
  operation: string
  remaining: number
  message: string
}>() {
  constructor(args: { operation: string; remaining: number }) {
    super({
      ...args,
      message: `Rate limit exceeded for ${args.operation}. ${args.remaining} requests remaining.`,
    })
  }
}

export class InsufficientCreditsError extends TaggedError(
  "InsufficientCreditsError",
)<{
  required?: number
  available?: number
  message: string
}>() {
  constructor(
    args: { required?: number; available?: number; message?: string } = {},
  ) {
    super({
      required: args.required,
      available: args.available,
      message: args.message ?? "Insufficient credits",
    })
  }
}

export class AutoTopupValidationError extends TaggedError(
  "AutoTopupValidationError",
)<{
  message: string
}>() {
  constructor(args: { message: string }) {
    super(args)
  }
}

export class CryptoOperationError extends TaggedError("CryptoOperationError")<{
  operation: string
  message: string
}>() {
  constructor(args: { operation: string; message?: string }) {
    super({
      ...args,
      message: args.message ?? `Crypto ${args.operation} failed`,
    })
  }
}

export class AiExecutionError extends TaggedError("AiExecutionError")<{
  message: string
  cause?: unknown
}>() {
  constructor(args: { message: string; cause?: unknown }) {
    super(args)
  }
}

export class ForbiddenError extends TaggedError("ForbiddenError")<{
  message: string
}>() {
  constructor(args: { message: string }) {
    super(args)
  }
}

export class UserNotFoundError extends TaggedError("UserNotFoundError")<{
  userId: string
  message: string
}>() {
  constructor(args: { userId: string }) {
    super({
      ...args,
      message: `User not found: ${args.userId}`,
    })
  }
}

export class UserCreditsNotFoundError extends TaggedError(
  "UserCreditsNotFoundError",
)<{
  userId: string
  message: string
}>() {
  constructor(args: { userId: string }) {
    super({
      ...args,
      message: `User credits not found for user: ${args.userId}`,
    })
  }
}

export class UserSettingsNotFoundError extends TaggedError(
  "UserSettingsNotFoundError",
)<{
  userId: string
  message: string
}>() {
  constructor(args: { userId: string }) {
    super({
      ...args,
      message: `User settings not found for user: ${args.userId}`,
    })
  }
}

export class SettingsNotFoundError extends TaggedError(
  "SettingsNotFoundError",
)<{
  key: string
  message: string
}>() {
  constructor(args: { key: string; message?: string }) {
    super({
      key: args.key,
      message: args.message ?? `Settings not found: ${args.key}`,
    })
  }
}

export class ToolNotAvailableError extends TaggedError(
  "ToolNotAvailableError",
)<{
  toolId: string
  message: string
}>() {
  constructor(args: { toolId: string }) {
    super({
      toolId: args.toolId,
      message: `Tool is not available: ${args.toolId}`,
    })
  }
}

export class ApiKeyInactiveError extends TaggedError("ApiKeyInactiveError")<{
  apiKeyId: string
  message: string
}>() {
  constructor(args: { apiKeyId: string; message?: string }) {
    super({
      apiKeyId: args.apiKeyId,
      message: args.message ?? `API key is inactive: ${args.apiKeyId}`,
    })
  }
}

export class ModelFetchError extends TaggedError("ModelFetchError")<{
  provider: string
  message: string
  cause?: unknown
}>() {
  constructor(args: { provider: string; message: string; cause?: unknown }) {
    super(args)
  }
}

export class ValidationError extends TaggedError("ValidationError")<{
  field?: string
  message: string
}>() {
  constructor(args: { field?: string; message: string }) {
    super(args)
  }
}

export type ToolProcedureError =
  | ToolNotFoundError
  | ToolValidationError
  | ToolConfigurationError
  | ReviewNotFoundError
  | ReviewValidationError
  | AssetNotFoundError
  | AssetValidationError
  | CategoryNotFoundError
  | CategoryValidationError
  | TagNotFoundError
  | TagValidationError
  | InsufficientCreditsError
  | CryptoOperationError
  | AiExecutionError
  | ForbiddenError
  | SettingsNotFoundError
  | ToolNotAvailableError
  | ApiKeyInactiveError
  | ValidationError

export type UserProcedureError =
  | ApiKeyNotFoundError
  | ApiKeyValidationError
  | RateLimitExceededError
  | AutoTopupValidationError
  | CryptoOperationError
  | ValidationError
  | UserNotFoundError
  | UserCreditsNotFoundError
  | UserSettingsNotFoundError

export type AdminProcedureError =
  | ApiKeyNotFoundError
  | ApiKeyValidationError
  | SettingsNotFoundError
  | CryptoOperationError
  | ValidationError
  | ModelFetchError
  | CategoryNotFoundError
  | CategoryValidationError
  | TagNotFoundError
  | TagValidationError

export type AssetProcedureError = AssetNotFoundError | AssetValidationError
