import { describe, expect, test } from "vite-plus/test"

import * as schema from "db/schema"

describe("schema index", () => {
  test("re-exports all schema tables", () => {
    expect(schema.adminSettingsTable).toBeDefined()
    expect(schema.aiModelsTable).toBeDefined()
    expect(schema.userSettingsTable).toBeDefined()
    expect(schema.subscriptionsTable).toBeDefined()
    expect(schema.productsTable).toBeDefined()
    expect(schema.productVersionsTable).toBeDefined()
    expect(schema.categoriesTable).toBeDefined()
    expect(schema.tagsTable).toBeDefined()
    expect(schema.productTagsTable).toBeDefined()
    expect(schema.productCategoriesTable).toBeDefined()
    expect(schema.productRunsTable).toBeDefined()
    expect(schema.userCreditsTable).toBeDefined()
    expect(schema.creditTransactionsTable).toBeDefined()
    expect(schema.polarPaymentsTable).toBeDefined()
    expect(schema.polarPaymentEventsTable).toBeDefined()
    expect(schema.polarCheckoutSessionsTable).toBeDefined()
    expect(schema.assetsTable).toBeDefined()
  })
})
