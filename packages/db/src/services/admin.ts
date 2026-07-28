import { and, asc, eq, gte, sql } from "drizzle-orm"

import { db } from "db"
import { adminSettingsTable, aiModelsTable, productRunsTable } from "db/schema"
import type { SelectAdminSettings } from "db/schema/admin-settings"

export const getSetting = async (
  key: string,
): Promise<SelectAdminSettings | null> => {
  const [setting] = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.settingKey, key))

  return setting ?? null
}

export const upsertSetting = async (
  key: string,
  value: unknown,
): Promise<SelectAdminSettings> => {
  const settingResult = await getSetting(key)

  if (settingResult) {
    const existing = settingResult
    const [updated] = await db
      .update(adminSettingsTable)
      .set({ settingValue: value, updatedAt: new Date() })
      .where(eq(adminSettingsTable.id, existing.id))
      .returning()

    return updated
  }

  const [created] = await db
    .insert(adminSettingsTable)
    .values({ settingKey: key, settingValue: value })
    .returning()

  return created
}

export const getAiRequestsHistory = (input: {
  startDate: Date
}): Promise<{ createdAt: Date | null }[]> => {
  return db
    .select({
      createdAt: productRunsTable.createdAt,
    })
    .from(productRunsTable)
    .where(
      and(
        gte(productRunsTable.createdAt, input.startDate),
        sql`${productRunsTable.status} IN ('completed', 'failed')`,
      ),
    )
}

export const listAIModels = () => {
  return db.select().from(aiModelsTable).orderBy(asc(aiModelsTable.displayName))
}

export const findAIModelByProviderAndModelId = async (
  provider: string,
  modelId: string,
) => {
  const [existing] = await db
    .select({ id: aiModelsTable.id, isEnabled: aiModelsTable.isEnabled })
    .from(aiModelsTable)
    .where(
      and(
        eq(aiModelsTable.provider, provider),
        eq(aiModelsTable.modelId, modelId),
      ),
    )

  return existing ?? null
}

export const findAIModelById = async (id: string) => {
  const [existing] = await db
    .select({ id: aiModelsTable.id })
    .from(aiModelsTable)
    .where(eq(aiModelsTable.id, id))

  return existing ?? null
}

export const createAIModel = async (input: {
  provider: string
  modelId: string
  displayName: string
  isEnabled: boolean
}) => {
  const [created] = await db
    .insert(aiModelsTable)
    .values({
      provider: input.provider,
      modelId: input.modelId,
      displayName: input.displayName,
      isEnabled: input.isEnabled,
    })
    .returning()

  return created
}

export const updateAIModelById = async (
  id: string,
  input: {
    provider?: string
    modelId?: string
    displayName?: string
    isEnabled?: boolean
  },
) => {
  const [updated] = await db
    .update(aiModelsTable)
    .set({
      ...(input.provider !== undefined && { provider: input.provider }),
      ...(input.modelId !== undefined && { modelId: input.modelId }),
      ...(input.displayName !== undefined && {
        displayName: input.displayName,
      }),
      ...(input.isEnabled !== undefined && {
        isEnabled: input.isEnabled,
      }),
      updatedAt: new Date(),
    })
    .where(eq(aiModelsTable.id, id))
    .returning()

  return updated
}

export const deleteAIModelById = async (id: string) => {
  await db.delete(aiModelsTable).where(eq(aiModelsTable.id, id))
}

export const deleteAIModelsByProvider = async (provider: string) => {
  await db.delete(aiModelsTable).where(eq(aiModelsTable.provider, provider))
}

export const getApiKeyStats = async (): Promise<{
  totalRequests: number
  requestsThisMonth: number
  monthlyCost: number
  previousMonthCost: number
}> => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  )
  const endOfPreviousMonth = startOfCurrentMonth

  const [totalRequestsResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(productRunsTable)

  const [currentMonthResult] = await db
    .select({
      count: sql<number>`COUNT(*)`,
      cost: sql<number>`COALESCE(SUM(CAST(${productRunsTable.cost} AS DECIMAL)), 0)`,
    })
    .from(productRunsTable)
    .where(sql`${productRunsTable.createdAt} >= ${startOfCurrentMonth}`)

  const [previousMonthResult] = await db
    .select({
      cost: sql<number>`COALESCE(SUM(CAST(${productRunsTable.cost} AS DECIMAL)), 0)`,
    })
    .from(productRunsTable)
    .where(
      sql`${productRunsTable.createdAt} >= ${startOfPreviousMonth} AND ${productRunsTable.createdAt} < ${endOfPreviousMonth}`,
    )

  return {
    totalRequests: Number(totalRequestsResult?.count ?? 0),
    requestsThisMonth: Number(currentMonthResult?.count ?? 0),
    monthlyCost: Number(currentMonthResult?.cost ?? 0),
    previousMonthCost: Number(previousMonthResult?.cost ?? 0),
  }
}
