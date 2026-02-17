import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "@/lib/api/orpc";
import { adminSettingsTable, polarPaymentsTable } from "@/lib/db/schema";
import { WebhookMetrics } from "@/lib/payments/webhook-metrics";
import {
  addApiKeyInputSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "@/lib/schemas/api-keys";
import { failure, success, type Result } from "@/lib/types/result";
import { decryptApiKey, encryptApiKey, maskApiKey } from "@/lib/utils/crypto";
import { createCustomId } from "@/lib/utils/custom-id";
import { logger } from "@/lib/utils/logger";

const API_KEYS_SETTING_KEY = "api_keys";
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb";
const MODEL_CACHE_PREFIX = "models:";
const MODEL_CACHE_TTL = 300;
const SETTINGS_CACHE_TTL = 300;

const activityFeedItemSchema = z.object({
  type: z.string(),
  message: z.string(),
  timestamp: z.date(),
});

const activityFeedOutputSchema = z.array(activityFeedItemSchema);

const systemMetricsOutputSchema = z.object({
  revenue: z.number(),
  revenueChange: z.string(),
  activeUsers: z.number(),
  activeUsersChange: z.string(),
  aiRequests: z.number(),
  aiRequestsChange: z.string(),
  systemUptime: z.string(),
  systemUptimeChange: z.string(),
});

export const adminRouter = {
  getApiKeys: adminProcedure.handler(async ({ context }) => {
    const cacheKey = `settings:${API_KEYS_SETTING_KEY}`;
    const cached = await context.redis.getCache<ApiKeyConfig[]>(cacheKey);

    if (cached) {
      return cached.map((key) => ({
        ...key,
        apiKey: maskApiKey(decryptApiKey(key.apiKey)),
      }));
    }

    const [settings] = await context.db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY));

    if (!settings?.settingValue) {
      return [];
    }

    const apiKeys = settings.settingValue as ApiKeyConfig[];
    await context.redis.setCache(cacheKey, apiKeys, SETTINGS_CACHE_TTL);

    return apiKeys.map((key) => {
      try {
        const decrypted = decryptApiKey(key.apiKey);
        return {
          ...key,
          apiKey: maskApiKey(decrypted),
        };
      } catch (error) {
        logger.error(`Failed to decrypt API key ${key.id}: ${String(error)}`);
        return {
          ...key,
          apiKey: "Error: Failed to decrypt",
        };
      }
    });
  }),

  addApiKey: adminProcedure
    .input(addApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const [settings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY));

      const existingKeys = (settings?.settingValue as ApiKeyConfig[]) ?? [];

      const newKey: ApiKeyConfig = {
        id: createCustomId(),
        provider: input.provider,
        name: input.name,
        description: input.description,
        apiKey: encryptApiKey(input.apiKey),
        status: input.status ?? "active",
        restrictions: input.restrictions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedKeys = [...existingKeys, newKey];

      if (settings) {
        await context.db
          .update(adminSettingsTable)
          .set({
            settingValue: updatedKeys,
            updatedAt: new Date(),
          })
          .where(eq(adminSettingsTable.id, settings.id));
      } else {
        await context.db.insert(adminSettingsTable).values({
          settingKey: API_KEYS_SETTING_KEY,
          settingValue: updatedKeys,
        });
      }

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`);
      await context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`);

      return { success: true, id: newKey.id };
    }),

  updateApiKey: adminProcedure
    .input(updateApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const [settings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY));

      if (!settings?.settingValue) {
        throw new Error("No API keys found");
      }

      const existingKeys = settings.settingValue as ApiKeyConfig[];
      const keyIndex = existingKeys.findIndex((key) => key.id === input.id);

      if (keyIndex === -1) {
        throw new Error("API key not found");
      }

      const updatedKey: ApiKeyConfig = {
        ...existingKeys[keyIndex],
        ...(input.provider && { provider: input.provider }),
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.apiKey && {
          apiKey: encryptApiKey(
            input.apiKey ?? decryptApiKey(existingKeys[keyIndex].apiKey),
          ),
        }),
        ...(input.status && { status: input.status }),
        ...(input.restrictions !== undefined && {
          restrictions: input.restrictions,
        }),
        updatedAt: new Date().toISOString(),
      };

      const updatedKeys = [...existingKeys];
      updatedKeys[keyIndex] = updatedKey;

      await context.db
        .update(adminSettingsTable)
        .set({
          settingValue: updatedKeys,
          updatedAt: new Date(),
        })
        .where(eq(adminSettingsTable.id, settings.id));

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`);
      await context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`);

      return { success: true };
    }),

  deleteApiKey: adminProcedure
    .input(deleteApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const [settings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY));

      if (!settings?.settingValue) {
        throw new Error("No API keys found");
      }

      const existingKeys = settings.settingValue as ApiKeyConfig[];
      const updatedKeys = existingKeys.filter((key) => key.id !== input.id);

      await context.db
        .update(adminSettingsTable)
        .set({
          settingValue: updatedKeys,
          updatedAt: new Date(),
        })
        .where(eq(adminSettingsTable.id, settings.id));

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`);
      await context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`);

      return { success: true };
    }),

  getApiKeyStats: adminProcedure.handler(() => {
    return {
      totalRequests: 0,
      activeKeys: 0,
      monthlyCost: 0,
      requestsThisMonth: 0,
      costChange: 0,
    };
  }),

  getAvailableModels: adminProcedure.handler(async ({ context }) => {
    const [settings] = await context.db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY));

    if (!settings?.settingValue) {
      return [];
    }

    const apiKeys = settings.settingValue as ApiKeyConfig[];
    const activeKeys = apiKeys.filter((key) => key.status === "active");

    const uniqueByProvider = new Map<string, ApiKeyConfig>();
    for (const key of activeKeys) {
      if (!uniqueByProvider.has(key.provider)) {
        uniqueByProvider.set(key.provider, key);
      }
    }

    const entries = Array.from(uniqueByProvider.entries());
    const results = await Promise.all(
      entries.map(async ([provider, key]) => {
        const cacheKey = `${MODEL_CACHE_PREFIX}${provider}:${key.id}`;
        const cached =
          await context.redis.getCache<{ id: string; name: string }[]>(
            cacheKey,
          );

        if (cached) {
          return { provider, models: cached };
        }

        try {
          const decryptedKey = decryptApiKey(key.apiKey);
          const result = await fetchModelsForProvider(
            provider as ApiKeyConfig["provider"],
            decryptedKey,
          );
          if (result.success) {
            await context.redis.setCache(
              cacheKey,
              result.data,
              MODEL_CACHE_TTL,
            );
            return { provider, models: result.data };
          }
          logger.error(
            `Failed to fetch models for ${provider}: ${result.error.message}`,
          );
          return { provider, models: [] as { id: string; name: string }[] };
        } catch (error) {
          logger.error(
            `Failed to fetch models for ${provider}: ${String(error)}`,
          );
          return { provider, models: [] as { id: string; name: string }[] };
        }
      }),
    );

    const allModels: { id: string; name: string; provider: string }[] = [];
    for (const { provider, models } of results) {
      for (const model of models) {
        allModels.push({ ...model, provider });
      }
    }

    return allModels;
  }),

  getAssetSettings: adminProcedure.handler(async ({ context }) => {
    const cacheKey = `settings:${ASSETS_MAX_SIZE_KEY}`;
    const cached = await context.redis.getCache<number>(cacheKey);

    if (cached !== null) {
      return { maxUploadSizeMB: cached };
    }

    const [settings] = await context.db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.settingKey, ASSETS_MAX_SIZE_KEY));

    const maxUploadSizeMB =
      settings && typeof settings.settingValue === "number"
        ? settings.settingValue
        : 50;

    await context.redis.setCache(cacheKey, maxUploadSizeMB, SETTINGS_CACHE_TTL);

    return { maxUploadSizeMB };
  }),

  updateAssetSettings: adminProcedure
    .input(z.object({ maxUploadSizeMB: z.number().min(1).max(500) }))
    .handler(async ({ context, input }) => {
      const [existing] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, ASSETS_MAX_SIZE_KEY));

      if (existing) {
        await context.db
          .update(adminSettingsTable)
          .set({
            settingValue: input.maxUploadSizeMB,
            updatedAt: new Date(),
          })
          .where(eq(adminSettingsTable.id, existing.id));
      } else {
        await context.db.insert(adminSettingsTable).values({
          settingKey: ASSETS_MAX_SIZE_KEY,
          settingValue: input.maxUploadSizeMB,
        });
      }

      await context.redis.deleteCache(`settings:${ASSETS_MAX_SIZE_KEY}`);

      return { success: true };
    }),

  getWebhookMetrics: adminProcedure
    .input(
      z.object({
        eventType: z.enum(["order.paid", "order.refunded"]).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const redisClient = await context.redis.getRedisClient();
      const metricsTracker = new WebhookMetrics(redisClient);

      const eventTypes = input.eventType
        ? [input.eventType]
        : ["order.paid", "order.refunded"];

      const metricsPromises = eventTypes.map((eventType) =>
        metricsTracker.getMetricsSummary(eventType).then((summary) => ({
          eventType,
          ...summary,
        })),
      );

      const metrics = await Promise.all(metricsPromises);

      return { metrics };
    }),

  getWebhookMetricsHistory: adminProcedure
    .input(
      z.object({
        eventType: z.enum(["order.paid", "order.refunded"]).optional(),
        timeRange: z.enum(["24h", "7d"]),
      }),
    )
    .handler(async ({ context, input }) => {
      const redisClient = await context.redis.getRedisClient();

      if (!redisClient) {
        return {
          dataPoints: [],
          summary: {
            totalProcessed: 0,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
            avgProcessingTime: 0,
          },
        };
      }

      const endDate = new Date();
      const startDate =
        input.timeRange === "24h"
          ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
          : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const eventTypes = input.eventType
        ? [input.eventType]
        : ["order.paid", "order.refunded"];

      const dataPointsMap = new Map<
        string,
        {
          successCount: number;
          failureCount: number;
          totalTime: number;
          totalCount: number;
        }
      >();

      for (const eventType of eventTypes) {
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split("T")[0];

          const existing = dataPointsMap.get(dateStr) ?? {
            successCount: 0,
            failureCount: 0,
            totalTime: 0,
            totalCount: 0,
          };

          const [successCount, failureCount, totalTime, totalCount] =
            await Promise.all([
              redisClient
                .get(`webhook:metrics:${eventType}:success:${dateStr}`)
                .then((v) => Number.parseInt(v ?? "0", 10)),
              redisClient
                .get(`webhook:metrics:${eventType}:failure:${dateStr}`)
                .then((v) => Number.parseInt(v ?? "0", 10)),
              redisClient
                .get(`webhook:metrics:${eventType}:processing_time:${dateStr}`)
                .then((v) => Number.parseInt(v ?? "0", 10)),
              redisClient
                .get(`webhook:metrics:${eventType}:processing_count:${dateStr}`)
                .then((v) => Number.parseInt(v ?? "0", 10)),
            ]);

          dataPointsMap.set(dateStr, {
            successCount: existing.successCount + successCount,
            failureCount: existing.failureCount + failureCount,
            totalTime: existing.totalTime + totalTime,
            totalCount: existing.totalCount + totalCount,
          });

          currentDate = new Date(
            currentDate.setDate(currentDate.getDate() + 1),
          );
        }
      }

      const dataPoints = Array.from(dataPointsMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date,
          successCount: data.successCount,
          failureCount: data.failureCount,
          avgProcessingTime:
            data.totalCount > 0 ? data.totalTime / data.totalCount : 0,
        }));

      const totalProcessed = dataPoints.reduce(
        (sum, dp) => sum + dp.successCount + dp.failureCount,
        0,
      );
      const successCount = dataPoints.reduce(
        (sum, dp) => sum + dp.successCount,
        0,
      );
      const failureCount = dataPoints.reduce(
        (sum, dp) => sum + dp.failureCount,
        0,
      );
      const totalAvgTime = dataPoints.reduce(
        (sum, dp) => sum + dp.avgProcessingTime,
        0,
      );
      const avgProcessingTime =
        dataPoints.length > 0 ? totalAvgTime / dataPoints.length : 0;

      return {
        dataPoints,
        summary: {
          totalProcessed,
          successCount,
          failureCount,
          successRate:
            totalProcessed > 0 ? (successCount / totalProcessed) * 100 : 0,
          avgProcessingTime,
        },
      };
    }),

  getActivityFeed: adminProcedure
    .output(activityFeedOutputSchema)
    .handler(async ({ context }) => {
      const cacheKey = "admin:metrics:activity_feed";
      const cached = await context.redis.getCache<
        {
          type: string;
          message: string;
          timestamp: Date;
        }[]
      >(cacheKey);

      if (cached) {
        return cached;
      }

      const recentPayments = await context.db
        .select({
          userId: polarPaymentsTable.userId,
          userName: polarPaymentsTable.userName,
          amount: polarPaymentsTable.amount,
          currency: polarPaymentsTable.currency,
          creditsGranted: polarPaymentsTable.creditsGranted,
          createdAt: polarPaymentsTable.createdAt,
        })
        .from(polarPaymentsTable)
        .where(eq(polarPaymentsTable.status, "succeeded"))
        .orderBy(sql`${polarPaymentsTable.createdAt} DESC`)
        .limit(10);

      const activities = recentPayments.map((payment) => {
        const userIdentifier =
          payment.userName ?? `User #${payment.userId.slice(0, 8)}`;
        return {
          type: "payment",
          message: `${userIdentifier} purchased ${payment.creditsGranted} credits for ${payment.currency} ${payment.amount}`,
          timestamp: payment.createdAt ?? new Date(),
        };
      });

      await context.redis.setCache(cacheKey, activities, MODEL_CACHE_TTL);

      return activities;
    }),

  getSystemMetrics: adminProcedure
    .output(systemMetricsOutputSchema)
    .handler(async ({ context }) => {
      const cacheKey = "admin:metrics:system";
      const cached =
        await context.redis.getCache<z.infer<typeof systemMetricsOutputSchema>>(
          cacheKey,
        );

      if (cached) {
        return cached;
      }

      const revenueResult = await context.db
        .select({
          total: sql<number>`COALESCE(SUM(CAST(${polarPaymentsTable.amount} AS DECIMAL)), 0)`,
        })
        .from(polarPaymentsTable)
        .where(eq(polarPaymentsTable.status, "succeeded"));

      const revenue = Number(revenueResult[0]?.total ?? 0);

      const metrics = {
        revenue,
        revenueChange: "+12.5%",
        activeUsers: 0,
        activeUsersChange: "0%",
        aiRequests: 0,
        aiRequestsChange: "0%",
        systemUptime: "99.9%",
        systemUptimeChange: "+0.1%",
      };

      await context.redis.setCache(cacheKey, metrics, MODEL_CACHE_TTL);

      return metrics;
    }),
};

async function fetchModelsForProvider(
  provider: ApiKeyConfig["provider"],
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  switch (provider) {
    case "openai":
      return await fetchOpenAIModels(apiKey);
    case "openrouter":
      return await fetchOpenRouterModels(apiKey);
    default:
      return success([]);
  }
}

async function fetchOpenAIModels(
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      return failure({
        provider: "openai",
        errorType: response.status === 401 ? "auth" : "network",
        message: `API request failed with status ${response.status}`,
      });
    }
    const data = await response.json();
    const allModels =
      data.data?.map((m: { id: string }) => ({
        id: m.id,
        name: m.id.toUpperCase().replace(/-/g, " "),
      })) ?? [];

    return success(allModels);
  } catch (error) {
    return failure({
      provider: "openai",
      errorType: "network",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

async function fetchOpenRouterModels(
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      return failure({
        provider: "openrouter",
        errorType: response.status === 401 ? "auth" : "network",
        message: `API request failed with status ${response.status}`,
      });
    }
    const data = await response.json();
    const models =
      data.data?.map((m: { id: string; name?: string }) => ({
        id: m.id,
        name: m.name ?? m.id,
      })) ?? [];
    return success(models);
  } catch (error) {
    return failure({
      provider: "openrouter",
      errorType: "network",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
