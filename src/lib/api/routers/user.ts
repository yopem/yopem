import { desc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure } from "@/lib/api/orpc"
import {
  creditTransactionsTable,
  toolRunsTable,
  toolsTable,
  userCreditsTable,
} from "@/lib/db/schema"
import { createCustomId } from "@/lib/utils/custom-id"

export const userRouter = {
  // eslint-disable-next-line @typescript-eslint/require-await
  getProfile: protectedProcedure.handler(async ({ context }) => {
    return {
      id: context.session.id,
      email: context.session.email,
      name: context.session.name,
      username: context.session.username,
      image: context.session.image,
    }
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
      }),
    )
    // eslint-disable-next-line @typescript-eslint/require-await
    .handler(async ({ context, input }) => {
      return {
        id: context.session.id,
        email: context.session.email,
        ...input,
      }
    }),

  getStats: protectedProcedure.handler(async ({ context }) => {
    const [credits] = await context.db
      .select({
        balance: userCreditsTable.balance,
        totalUsed: userCreditsTable.totalUsed,
        totalPurchased: userCreditsTable.totalPurchased,
      })
      .from(userCreditsTable)
      .where(eq(userCreditsTable.userId, context.session.id))

    const runs = await context.db
      .select({ count: sql<number>`count(*)` })
      .from(toolRunsTable)
      .where(eq(toolRunsTable.userId, context.session.id))

    return {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      balance: credits?.balance ?? "0",
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      totalUsed: credits?.totalUsed ?? "0",
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      totalPurchased: credits?.totalPurchased ?? "0",
      totalRuns: Number(runs[0]?.count ?? 0),
    }
  }),

  getRuns: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const limit = input?.limit ?? 20

      const runs = await context.db
        .select({
          id: toolRunsTable.id,
          toolId: toolRunsTable.toolId,
          status: toolRunsTable.status,
          cost: toolRunsTable.cost,
          createdAt: toolRunsTable.createdAt,
          toolName: toolsTable.name,
        })
        .from(toolRunsTable)
        .leftJoin(toolsTable, eq(toolRunsTable.toolId, toolsTable.id))
        .where(eq(toolRunsTable.userId, context.session.id))
        .orderBy(desc(toolRunsTable.createdAt))
        .limit(limit + 1)

      let nextCursor: string | undefined = undefined
      if (runs.length > limit) {
        const nextItem = runs.pop()
        nextCursor = nextItem?.id
      }

      return { runs, nextCursor }
    }),

  getCredits: protectedProcedure.handler(async ({ context }) => {
    const [credits] = await context.db
      .select()
      .from(userCreditsTable)
      .where(eq(userCreditsTable.userId, context.session.id))

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return credits ?? null
  }),

  getTransactions: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const limit = input?.limit ?? 20

      const transactions = await context.db
        .select({
          id: creditTransactionsTable.id,
          amount: creditTransactionsTable.amount,
          type: creditTransactionsTable.type,
          description: creditTransactionsTable.description,
          createdAt: creditTransactionsTable.createdAt,
        })
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.userId, context.session.id))
        .orderBy(desc(creditTransactionsTable.createdAt))
        .limit(limit)

      return transactions
    }),

  addCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      let [credits] = await context.db
        .select()
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, context.session.id))

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!credits) {
        const newCredits = {
          id: createCustomId(),
          userId: context.session.id,
          balance: String(input.amount),
          totalPurchased: String(input.amount),
          totalUsed: "0",
        }
        await context.db.insert(userCreditsTable).values(newCredits)
        credits = newCredits as typeof credits
      } else {
        await context.db
          .update(userCreditsTable)
          .set({
            balance: sql`${userCreditsTable.balance} + ${input.amount}`,
            totalPurchased: sql`${userCreditsTable.totalPurchased} + ${input.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(userCreditsTable.userId, context.session.id))
      }

      await context.db.insert(creditTransactionsTable).values({
        id: createCustomId(),
        userId: context.session.id,
        amount: String(input.amount),
        type: "purchase",
        description: `Purchased ${input.amount} credits`,
      })

      return { success: true, amount: input.amount }
    }),
}
