import { SQL } from "bun"
import { drizzle } from "drizzle-orm/bun-sql"

import { databaseUrl, isDev } from "env"

import { adminSettingsTable } from "./schema/admin-settings"
import { aiModelsTable } from "./schema/ai-models"
import { assetsTable } from "./schema/assets"
import { categoriesTable } from "./schema/categories"
import { productCategoriesTable } from "./schema/product-categories"
import { productRunsTable } from "./schema/product-runs"
import { productTagsTable } from "./schema/product-tags"
import { productVersionsTable } from "./schema/product-versions"
import { productsTable } from "./schema/products"
import { tagsTable } from "./schema/tags"
import { userSettingsTable } from "./schema/user-settings"

const schema = {
  adminSettingsTable,
  aiModelsTable,
  assetsTable,
  categoriesTable,
  productCategoriesTable,
  productRunsTable,
  productTagsTable,
  productVersionsTable,
  productsTable,
  tagsTable,
  userSettingsTable,
}

const sql = new SQL({
  url: databaseUrl,
  max: 20,
  idleTimeout: 30,
  connectionTimeout: 5,
  onconnect: () => {
    if (isDev) {
      console.info("New database connection established")
    }
  },
  onclose: (error) => {
    if (!error) return
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes("Idle timeout")) {
      console.error(`Database connection closed: ${message}`)
    }
  },
})

export const db = drizzle(sql, { schema })
