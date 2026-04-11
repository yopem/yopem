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
import { logger } from "logger"

const args = process.argv.slice(2)
const isSingleUser = args.includes("--single-user")
const userIdIndex = args.indexOf("--single-user")

async function main() {
  logger.info("Starting grandfathered migration...")

  try {
    if (isSingleUser && userIdIndex !== -1 && args[userIdIndex + 1]) {
      const userId = args[userIdIndex + 1]
      logger.info(`Migrating single user: ${userId}`)

      const result = await migrateSingleUser(userId)

      if (result.isErr()) {
        logger.error(
          `Failed to migrate user ${userId}: ${result.error.message}`,
        )
        process.exit(1)
      }

      logger.info(`Successfully migrated user ${userId}:`)
      logger.info(`  Tier: ${result.value.tier}`)
      logger.info(`  Expires: ${result.value.expiresAt.toISOString()}`)
    } else {
      logger.info("Running batch migration for all users with credits...")

      const result = await migrateExistingCreditsToSubscriptions()

      if (result.isErr()) {
        logger.error(`Migration failed: ${result.error.message}`)
        process.exit(1)
      }

      const { migratedCount, failedCount, errors } = result.value

      logger.info("Migration complete!")
      logger.info(`  Migrated: ${migratedCount} users`)
      logger.info(`  Failed: ${failedCount} users`)

      if (errors.length > 0) {
        logger.warn("Errors encountered:")
        for (const error of errors) {
          logger.warn(`  User ${error.userId}: ${error.error}`)
        }
      }

      if (failedCount > 0) {
        process.exit(1)
      }
    }

    logger.info("Migration completed successfully!")
    process.exit(0)
  } catch (error) {
    logger.error(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exit(1)
  }
}

main()
