import { describe, expect, test } from "vite-plus/test"

import {
  subscriptionsTable,
  insertSubscriptionSchema,
  updateSubscriptionSchema,
  subscriptionTierEnum,
  subscriptionStatusEnum,
  subscriptionSourceEnum,
} from "db/schema/subscriptions"

describe("subscriptions schema", () => {
  test("exports the table", () => {
    expect(subscriptionsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertSubscriptionSchema.safeParse({ userId: "u" })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateSubscriptionSchema.safeParse({ userId: "u" })
    expect(result.success).toBe(true)
  })

  test("exports subscriptionTierEnum", () => {
    expect(subscriptionTierEnum).toBeDefined()
    expect(subscriptionTierEnum.length).toBeGreaterThan(0)
  })

  test("exports subscriptionStatusEnum", () => {
    expect(subscriptionStatusEnum).toBeDefined()
    expect(subscriptionStatusEnum.length).toBeGreaterThan(0)
  })

  test("exports subscriptionSourceEnum", () => {
    expect(subscriptionSourceEnum).toBeDefined()
    expect(subscriptionSourceEnum.length).toBeGreaterThan(0)
  })
})
