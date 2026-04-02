import type { Result } from "better-result"

import { ORPCError } from "@orpc/server"
import { panic } from "better-result"

import {
  AiExecutionError,
  ApiKeyInactiveError,
  ApiKeyNotFoundError,
  ApiKeyValidationError,
  AssetNotFoundError,
  AssetValidationError,
  CategoryValidationError,
  CryptoOperationError,
  ForbiddenError,
  InsufficientCreditsError,
  ModelFetchError,
  ReviewNotFoundError,
  SettingsNotFoundError,
  TagValidationError,
  ToolConfigurationError,
  ToolNotAvailableError,
  ToolNotFoundError,
  ToolValidationError,
  UserCreditsNotFoundError,
  UserNotFoundError,
  ValidationError,
} from "./procedure-errors"

export function handleProcedureError<E>(result: Result<unknown, E>): never {
  if (result.isOk()) {
    panic("handleProcedureError called on ok result")
  }

  const error = result.error

  if (ToolNotFoundError.is(error) || AssetNotFoundError.is(error)) {
    throw new ORPCError("NOT_FOUND", { message: error.message })
  }

  if (ReviewNotFoundError.is(error) || SettingsNotFoundError.is(error)) {
    throw new ORPCError("NOT_FOUND", { message: error.message })
  }

  if (UserNotFoundError.is(error) || UserCreditsNotFoundError.is(error)) {
    throw new ORPCError("NOT_FOUND", { message: error.message })
  }

  if (ApiKeyNotFoundError.is(error)) {
    throw new ORPCError("NOT_FOUND", { message: error.message })
  }

  if (
    ToolValidationError.is(error) ||
    ValidationError.is(error) ||
    AssetValidationError.is(error) ||
    CategoryValidationError.is(error) ||
    TagValidationError.is(error) ||
    ApiKeyValidationError.is(error)
  ) {
    throw new ORPCError("BAD_REQUEST", { message: error.message })
  }

  if (
    ToolConfigurationError.is(error) ||
    ToolNotAvailableError.is(error) ||
    ApiKeyInactiveError.is(error)
  ) {
    throw new ORPCError("BAD_REQUEST", { message: error.message })
  }

  if (InsufficientCreditsError.is(error)) {
    throw new ORPCError("BAD_REQUEST", { message: error.message })
  }

  if (ForbiddenError.is(error)) {
    throw new ORPCError("FORBIDDEN", { message: error.message })
  }

  if (CryptoOperationError.is(error)) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: error.message,
    })
  }

  if (AiExecutionError.is(error)) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: error.message,
      cause: error.cause,
    })
  }

  if (ModelFetchError.is(error)) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: error.message,
    })
  }

  throw new ORPCError("INTERNAL_SERVER_ERROR", {
    message: error instanceof Error ? error.message : "Unknown error",
  })
}
