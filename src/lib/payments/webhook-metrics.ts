import type { Redis } from "ioredis"

import { logger } from "@/lib/utils/logger"

export interface WebhookMetricsSummary {
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

    try {
      const date = new Date().toISOString().split("T")[0]
      const counterKey = `webhook:metrics:${eventType}:${status}:${date}`

      await this.redis.incr(counterKey)
      await this.redis.expire(counterKey, 60 * 60 * 24 * 30)
    } catch (error) {
      logger.error(
        `Failed to increment webhook counter: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async trackProcessingTime(
    eventType: string,
    processingTimeMs: number,
  ): Promise<void> {
    if (!this.redis) return

    try {
      const date = new Date().toISOString().split("T")[0]
      const timeKey = `webhook:metrics:${eventType}:processing_time:${date}`
      const countKey = `webhook:metrics:${eventType}:processing_count:${date}`

      await this.redis.incrby(timeKey, processingTimeMs)
      await this.redis.incr(countKey)
      await this.redis.expire(timeKey, 60 * 60 * 24 * 30)
      await this.redis.expire(countKey, 60 * 60 * 24 * 30)
    } catch (error) {
      logger.error(
        `Failed to track processing time: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async trackEventTimestamp(eventType: string): Promise<void> {
    if (!this.redis) return

    try {
      const timestampKey = `webhook:timestamps:${eventType}`
      const now = Date.now()

      await this.redis.zadd(timestampKey, now, `${now}`)
      await this.redis.zremrangebyscore(timestampKey, 0, now - 60 * 60 * 1000)
      await this.redis.expire(timestampKey, 60 * 60 * 2)
    } catch (error) {
      logger.error(
        `Failed to track event timestamp: ${error instanceof Error ? error.message : String(error)}`,
      )
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

    try {
      const date = new Date().toISOString().split("T")[0]
      const successKey = `webhook:metrics:${eventType}:success:${date}`
      const failureKey = `webhook:metrics:${eventType}:failure:${date}`
      const timeKey = `webhook:metrics:${eventType}:processing_time:${date}`
      const countKey = `webhook:metrics:${eventType}:processing_count:${date}`
      const timestampKey = `webhook:timestamps:${eventType}`

      const [successCount, failureCount, totalTime, totalCount, lastHourCount] =
        await Promise.all([
          this.redis.get(successKey).then((v) => Number.parseInt(v ?? "0", 10)),
          this.redis.get(failureKey).then((v) => Number.parseInt(v ?? "0", 10)),
          this.redis.get(timeKey).then((v) => Number.parseInt(v ?? "0", 10)),
          this.redis.get(countKey).then((v) => Number.parseInt(v ?? "0", 10)),
          this.redis
            .zcount(timestampKey, Date.now() - 60 * 60 * 1000, Date.now())
            .catch(() => 0),
        ])

      return {
        totalProcessed: successCount + failureCount,
        successCount,
        failureCount,
        averageProcessingTimeMs: totalCount > 0 ? totalTime / totalCount : 0,
        lastHourRate: lastHourCount,
      }
    } catch (error) {
      logger.error(
        `Failed to get metrics summary: ${error instanceof Error ? error.message : String(error)}`,
      )
      return {
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        averageProcessingTimeMs: 0,
        lastHourRate: 0,
      }
    }
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
