export class RateLimitError extends Error {
  readonly tag = "RateLimitError" as const
  operation: string
  cause: unknown

  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super(`Rate limit ${args.operation} failed: ${msg}`)
    this.operation = args.operation
    this.cause = args.cause
    this.name = "RateLimitError"
  }
}

export class WebhookHandlerError extends Error {
  readonly tag = "WebhookHandlerError" as const
  operation: string
  cause: unknown

  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super(`Webhook ${args.operation} failed: ${msg}`)
    this.operation = args.operation
    this.cause = args.cause
    this.name = "WebhookHandlerError"
  }
}

export class CheckoutHandlerError extends Error {
  readonly tag = "CheckoutHandlerError" as const
  operation: string
  cause: unknown

  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super(`Checkout ${args.operation} failed: ${msg}`)
    this.operation = args.operation
    this.cause = args.cause
    this.name = "CheckoutHandlerError"
  }
}

export class PortalHandlerError extends Error {
  readonly tag = "PortalHandlerError" as const
  operation: string
  cause: unknown

  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super(`Portal ${args.operation} failed: ${msg}`)
    this.operation = args.operation
    this.cause = args.cause
    this.name = "PortalHandlerError"
  }
}

export type ServerError =
  | RateLimitError
  | WebhookHandlerError
  | CheckoutHandlerError
  | PortalHandlerError
