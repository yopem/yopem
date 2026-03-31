import type { Redis } from "ioredis"

import { Result } from "better-result"

import { logger } from "logger"

import type { WebhookExecutionError } from "./errors.ts"

import { WebhookMetricsError } from "./errors.ts"
import { WebhookMetrics as WebhookMetricsTracker } from "./webhook-metrics.ts"

interface WebhookMonitorMetrics {
  eventType: string
  status: "success" | "failure" | "anomaly"
  processingTimeMs: number
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export class WebhookMonitor {
  private static metricsTracker: WebhookMetricsTracker | null = null

  static setRedisClient(redis: Redis | null) {
    this.metricsTracker = new WebhookMetricsTracker(redis)
  }

  static logWebhookEvent(metrics: WebhookMonitorMetrics) {
    const logData = {
      eventType: metrics.eventType,
      status: metrics.status,
      processingTimeMs: metrics.processingTimeMs,
      ...(metrics.errorMessage && { errorMessage: metrics.errorMessage }),
      ...(metrics.metadata && { metadata: metrics.metadata }),
    }

    if (metrics.status === "failure") {
      logger.error(logData, `Webhook processing failed: ${metrics.eventType}`)
    } else if (metrics.status === "anomaly") {
      logger.warn(logData, `Webhook anomaly detected: ${metrics.eventType}`)
    } else {
      logger.info(
        logData,
        `Webhook processed successfully: ${metrics.eventType}`,
      )
    }
  }

  static async trackWebhookExecution<T, E>(
    eventType: string,
    metadata: Record<string, unknown>,
    handler: () => Promise<Result<T, E>>,
  ): Promise<Result<T, E | WebhookExecutionError | WebhookMetricsError>> {
    const startTime = Date.now()

    const result = await handler()
    const processingTimeMs = Date.now() - startTime

    if (result.isOk()) {
      this.logWebhookEvent({
        eventType,
        status: "success",
        processingTimeMs,
        metadata,
      })

      if (this.metricsTracker) {
        const metricsResult = await Result.tryPromise({
          try: () =>
            this.metricsTracker!.recordWebhookEvent(
              eventType,
              "success",
              processingTimeMs,
            ),
          catch: (e) =>
            new WebhookMetricsError({ operation: "record", cause: e }),
        })

        if (metricsResult.isErr()) {
          return Result.err(metricsResult.error)
        }
      }

      return result
    }

    const error = result.error
    this.logWebhookEvent({
      eventType,
      status: "failure",
      processingTimeMs,
      errorMessage: String(error),
      metadata,
    })

    if (this.metricsTracker) {
      const metricsResult = await Result.tryPromise({
        try: () =>
          this.metricsTracker!.recordWebhookEvent(
            eventType,
            "failure",
            processingTimeMs,
          ),
        catch: (e) =>
          new WebhookMetricsError({ operation: "record", cause: e }),
      })

      if (metricsResult.isErr()) {
        return Result.err(metricsResult.error)
      }
    }

    return result
  }

  static detectAnomalousRefund(params: {
    refundAmount: number
    totalAmount: number
    orderId: string
  }) {
    const { refundAmount, totalAmount, orderId } = params

    if (refundAmount > totalAmount) {
      this.logWebhookEvent({
        eventType: "order.refunded",
        status: "anomaly",
        processingTimeMs: 0,
        errorMessage: `Refund exceeds total: ${refundAmount} > ${totalAmount}`,
        metadata: { orderId, refundAmount, totalAmount },
      })
      return true
    }

    const refundRatio = refundAmount / totalAmount
    if (refundRatio > 1.1) {
      this.logWebhookEvent({
        eventType: "order.refunded",
        status: "anomaly",
        processingTimeMs: 0,
        errorMessage: `Refund ratio suspicious: ${refundRatio.toFixed(2)}x`,
        metadata: { orderId, refundAmount, totalAmount, refundRatio },
      })
      return true
    }

    return false
  }

  static detectDuplicateWebhook(params: {
    eventType: string
    orderId: string
    isProcessed: boolean
  }) {
    const { eventType, orderId, isProcessed } = params

    if (isProcessed) {
      logger.info(
        { eventType, orderId },
        `Duplicate webhook detected (idempotent): ${eventType} for ${orderId}`,
      )
      return true
    }

    return false
  }
}
