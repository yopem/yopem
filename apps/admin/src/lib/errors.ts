import { TaggedError } from "better-result"

export class AuthRedirectError extends TaggedError("AuthRedirectError")<{
  message: string
  redirectUrl: string
}>() {}

export class LogoutError extends TaggedError("LogoutError")<{
  message: string
  cause?: unknown
}>() {}

export class AssetLoadError extends TaggedError("AssetLoadError")<{
  message: string
  cause?: unknown
}>() {}

export class AssetUploadError extends TaggedError("AssetUploadError")<{
  message: string
  cause?: unknown
}>() {}

export class ApiKeyOperationError extends TaggedError("ApiKeyOperationError")<{
  message: string
  operation: "add" | "update" | "delete" | "fetch"
  cause?: unknown
}>() {}

export class AssetSettingsError extends TaggedError("AssetSettingsError")<{
  message: string
  operation: "fetch" | "update"
  cause?: unknown
}>() {}

export class WebhookMetricsError extends TaggedError("WebhookMetricsError")<{
  message: string
  cause?: unknown
}>() {}
