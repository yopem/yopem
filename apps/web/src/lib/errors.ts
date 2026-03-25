import { TaggedError } from "better-result"

export class AuthRedirectError extends TaggedError("AuthRedirectError")<{
  message: string
  redirectUrl: string
}>() {}

export class LogoutError extends TaggedError("LogoutError")<{
  message: string
  cause?: unknown
}>() {}

export class ReviewLoadError extends TaggedError("ReviewLoadError")<{
  message: string
  cause?: unknown
}>() {}

export class ReviewSubmitError extends TaggedError("ReviewSubmitError")<{
  message: string
  cause?: unknown
}>() {}
