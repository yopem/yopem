import type { Redis } from "ioredis"

import { logger } from "@/lib/utils/logger"

import { WebhookMetrics as WebhookMetricsTracker } from "./webhook-metrics"

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

  static async trackWebhookExecution<T>(
    eventType: string,
    metadata: Record<string, unknown>,
    handler: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await handler()
      const processingTimeMs = Date.now() - startTime

      this.logWebhookEvent({
        eventType,
        status: "success",
        processingTimeMs,
        metadata,
      })

      if (this.metricsTracker) {
        await this.metricsTracker.recordWebhookEvent(
          eventType,
          "success",
          processingTimeMs,
        )
      }

      return result
    } catch (error) {
      const processingTimeMs = Date.now() - startTime

      this.logWebhookEvent({
        eventType,
        status: "failure",
        processingTimeMs,
        errorMessage: error instanceof Error ? error.message : String(error),
        metadata,
      })

      if (this.metricsTracker) {
        await this.metricsTracker.recordWebhookEvent(
          eventType,
          "failure",
          processingTimeMs,
        )
      }

      throw error
    }
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
