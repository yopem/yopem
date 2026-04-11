#!/usr/bin/env bun
/**
 * CLI script to migrate existing credit users to subscription tiers.
 *
 * Usage:
 *   bun run scripts/migrate-to-subscriptions.ts
 *   bun run scripts/migrate-to-subscriptions.ts --single-user <user-id>
 */

import {
  migrateExistingCreditsToSubscriptions,
  migrateSingleUser,
} from "db/services/grandfathered-migration"

const args = process.argv.slice(2)
const isSingleUser = args.includes("--single-user")
const userIdIndex = args.indexOf("--single-user")

async function main() {
  console.info("Starting grandfathered migration...")

  try {
    if (isSingleUser && userIdIndex !== -1 && args[userIdIndex + 1]) {
      const userId = args[userIdIndex + 1]
      console.info(`Migrating single user: ${userId}`)

      const result = await migrateSingleUser(userId)

      console.info(`Successfully migrated user ${userId}:`)
      console.info(`  Tier: ${result.tier}`)
      console.info(`  Expires: ${result.expiresAt.toISOString()}`)
    } else {
      console.info("Running batch migration for all users with credits...")

      const { migratedCount, failedCount, errors } =
        await migrateExistingCreditsToSubscriptions()

      console.info("Migration complete!")
      console.info(`  Migrated: ${migratedCount} users`)
      console.info(`  Failed: ${failedCount} users`)

      if (errors.length > 0) {
        console.warn("Errors encountered:")
        for (const error of errors) {
          console.warn(`  User ${error.userId}: ${error.error}`)
        }
      }

      if (failedCount > 0) {
        process.exit(1)
      }
    }

    console.info("Migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exit(1)
  }
}

main()
