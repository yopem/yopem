import { HTTPException } from "hono/http-exception"

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

const statusMap = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

const codeByStatus = Object.fromEntries(
  Object.entries(statusMap).map(([code, status]) => [status, code]),
) as Record<number, keyof typeof statusMap>

export const orpcCodeForStatus = (status: number): keyof typeof statusMap =>
  codeByStatus[status] ?? "INTERNAL_SERVER_ERROR"

export class ApiError extends HTTPException {
  constructor(
    code: keyof typeof statusMap,
    options: { message: string; cause?: unknown },
  ) {
    super(statusMap[code], {
      message: options.message,
      cause: options.cause,
    })
  }
}

export type ServerError =
  | RateLimitError
  | WebhookHandlerError
  | CheckoutHandlerError
  | PortalHandlerError
