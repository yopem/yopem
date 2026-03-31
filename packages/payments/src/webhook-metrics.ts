import type { Redis } from "ioredis"

import { Result, TaggedError } from "better-result"

import { logger } from "logger"

export class WebhookMetricsError extends TaggedError("WebhookMetricsError")<{
  operation: string
  message: string
  cause?: unknown
}>() {}

interface WebhookMetricsSummary {
  totalProcessed: number
  successCount: number
  failureCount: number
  averageProcessingTimeMs: number
  lastHourRate: number
}

export class WebhookMetrics {
  private redis: Redis | null = null

  constructor(redis: Redis | null) {
    this.redis = redis
  }

  async incrementCounter(
    eventType: string,
    status: "success" | "failure",
  ): Promise<void> {
    if (!this.redis) return

    const result = await Result.tryPromise({
      try: async () => {
        const date = new Date().toISOString().split("T")[0]
        const counterKey = `webhook:metrics:${eventType}:${status}:${date}`

        await this.redis!.incr(counterKey)
        await this.redis!.expire(counterKey, 60 * 60 * 24 * 30)
      },
      catch: (error) =>
        new WebhookMetricsError({
          operation: "incrementCounter",
          message: "Failed to increment webhook counter",
          cause: error,
        }),
    })

    if (result.isErr()) {
      logger.error(
        `Failed to increment webhook counter: ${result.error.message}`,
      )
    }
  }

  async trackProcessingTime(
    eventType: string,
    processingTimeMs: number,
  ): Promise<void> {
    if (!this.redis) return

    const result = await Result.tryPromise({
      try: async () => {
        const date = new Date().toISOString().split("T")[0]
        const timeKey = `webhook:metrics:${eventType}:processing_time:${date}`
        const countKey = `webhook:metrics:${eventType}:processing_count:${date}`

        await this.redis!.incrby(timeKey, processingTimeMs)
        await this.redis!.incr(countKey)
        await this.redis!.expire(timeKey, 60 * 60 * 24 * 30)
        await this.redis!.expire(countKey, 60 * 60 * 24 * 30)
      },
      catch: (error) =>
        new WebhookMetricsError({
          operation: "trackProcessingTime",
          message: "Failed to track processing time",
          cause: error,
        }),
    })

    if (result.isErr()) {
      logger.error(`Failed to track processing time: ${result.error.message}`)
    }
  }

  async trackEventTimestamp(eventType: string): Promise<void> {
    if (!this.redis) return

    const result = await Result.tryPromise({
      try: async () => {
        const timestampKey = `webhook:timestamps:${eventType}`
        const now = Date.now()

        await this.redis!.zadd(timestampKey, now, `${now}`)
        await this.redis!.zremrangebyscore(
          timestampKey,
          0,
          now - 60 * 60 * 1000,
        )
        await this.redis!.expire(timestampKey, 60 * 60 * 2)
      },
      catch: (error) =>
        new WebhookMetricsError({
          operation: "trackEventTimestamp",
          message: "Failed to track event timestamp",
          cause: error,
        }),
    })

    if (result.isErr()) {
      logger.error(`Failed to track event timestamp: ${result.error.message}`)
    }
  }

  async getMetricsSummary(eventType: string): Promise<WebhookMetricsSummary> {
    if (!this.redis) {
      return {
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        averageProcessingTimeMs: 0,
        lastHourRate: 0,
      }
    }

    const result = await Result.tryPromise({
      try: async () => {
        const date = new Date().toISOString().split("T")[0]
        const successKey = `webhook:metrics:${eventType}:success:${date}`
        const failureKey = `webhook:metrics:${eventType}:failure:${date}`
        const timeKey = `webhook:metrics:${eventType}:processing_time:${date}`
        const countKey = `webhook:metrics:${eventType}:processing_count:${date}`
        const timestampKey = `webhook:timestamps:${eventType}`

        const [
          successCount,
          failureCount,
          totalTime,
          totalCount,
          lastHourCount,
        ] = await Promise.all([
          this.redis!.get(successKey).then((v) =>
            Number.parseInt(v ?? "0", 10),
          ),
          this.redis!.get(failureKey).then((v) =>
            Number.parseInt(v ?? "0", 10),
          ),
          this.redis!.get(timeKey).then((v) => Number.parseInt(v ?? "0", 10)),
          this.redis!.get(countKey).then((v) => Number.parseInt(v ?? "0", 10)),
          Result.tryPromise({
            try: () =>
              this.redis!.zcount(
                timestampKey,
                Date.now() - 60 * 60 * 1000,
                Date.now(),
              ),
            catch: () => 0,
          }).then((r) => (r.isOk() ? r.value : 0)),
        ])

        return {
          totalProcessed: successCount + failureCount,
          successCount,
          failureCount,
          averageProcessingTimeMs: totalCount > 0 ? totalTime / totalCount : 0,
          lastHourRate: lastHourCount,
        }
      },
      catch: (error) =>
        new WebhookMetricsError({
          operation: "getMetricsSummary",
          message: "Failed to get metrics summary",
          cause: error,
        }),
    })

    if (result.isErr()) {
      logger.error(`Failed to get metrics summary: ${result.error.message}`)
      return {
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        averageProcessingTimeMs: 0,
        lastHourRate: 0,
      }
    }

    return result.value
  }

  async recordWebhookEvent(
    eventType: string,
    status: "success" | "failure",
    processingTimeMs: number,
  ): Promise<void> {
    await Promise.all([
      this.incrementCounter(eventType, status),
      this.trackProcessingTime(eventType, processingTimeMs),
      this.trackEventTimestamp(eventType),
    ])
  }
}
