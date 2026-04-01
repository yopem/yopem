import { TaggedError } from "better-result"

export class PaymentNotFoundError extends TaggedError("PaymentNotFoundError")<{
  polarPaymentId: string
  message: string
}>() {
  constructor(args: { polarPaymentId: string }) {
    super({
      ...args,
      message: `Payment with id ${args.polarPaymentId} not found`,
    })
  }
}

export class PaymentAlreadyProcessedError extends TaggedError(
  "PaymentAlreadyProcessedError",
)<{
  polarPaymentId: string
  message: string
}>() {
  constructor(args: { polarPaymentId: string }) {
    super({
      ...args,
      message: `Payment ${args.polarPaymentId} already processed`,
    })
  }
}

export class RefundValidationError extends TaggedError(
  "RefundValidationError",
)<{
  polarPaymentId: string
  message: string
}>() {}

export class WebhookExecutionError extends TaggedError(
  "WebhookExecutionError",
)<{
  eventType: string
  message: string
  cause: unknown
}>() {
  constructor(args: { eventType: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({
      ...args,
      message: `Webhook execution failed for ${args.eventType}: ${msg}`,
    })
  }
}

export class AutoTopupError extends TaggedError("AutoTopupError")<{
  userId: string
  message: string
  cause: unknown
}>() {
  constructor(args: { userId: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({
      ...args,
      message: `Auto-topup failed for user ${args.userId}: ${msg}`,
    })
  }
}

export class WebhookMetricsError extends TaggedError("WebhookMetricsError")<{
  operation: string
  message: string
  cause: unknown
}>() {
  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({
      ...args,
      message: `Webhook metrics ${args.operation} failed: ${msg}`,
    })
  }
}

export type PaymentError =
  | PaymentNotFoundError
  | PaymentAlreadyProcessedError
  | RefundValidationError
  | WebhookExecutionError
  | AutoTopupError
  | WebhookMetricsError
