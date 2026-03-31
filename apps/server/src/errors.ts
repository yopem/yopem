import { TaggedError } from "better-result"

export class RateLimitError extends TaggedError("RateLimitError")<{
  operation: string
  message: string
  cause: unknown
}>() {
  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({ ...args, message: `Rate limit ${args.operation} failed: ${msg}` })
  }
}

export class WebhookHandlerError extends TaggedError("WebhookHandlerError")<{
  operation: string
  message: string
  cause: unknown
}>() {
  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({ ...args, message: `Webhook ${args.operation} failed: ${msg}` })
  }
}

export class CheckoutHandlerError extends TaggedError("CheckoutHandlerError")<{
  operation: string
  message: string
  cause: unknown
}>() {
  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({ ...args, message: `Checkout ${args.operation} failed: ${msg}` })
  }
}

export class PortalHandlerError extends TaggedError("PortalHandlerError")<{
  operation: string
  message: string
  cause: unknown
}>() {
  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({ ...args, message: `Portal ${args.operation} failed: ${msg}` })
  }
}

export type ServerError =
  | RateLimitError
  | WebhookHandlerError
  | CheckoutHandlerError
  | PortalHandlerError
