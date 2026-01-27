import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, publicProcedure } from "@/lib/api/orpc"
import {
  categoriesTable,
  creditTransactionsTable,
  insertToolSchema,
  tagsTable,
  toolRunsTable,
  toolsTable,
  updateToolSchema,
  userCreditsTable,
} from "@/lib/db/schema"
import { createCustomId } from "@/lib/utils/custom-id"
import { generateUniqueToolSlug } from "@/lib/utils/slug"

export const toolsRouter = {
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
          search: z.string().optional(),
          categoryId: z.string().optional(),
          status: z.enum(["draft", "active", "archived", "all"]).optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const limit = input?.limit ?? 20
      const conditions = []

      if (input?.status && input.status !== "all") {
        conditions.push(eq(toolsTable.status, input.status))
      } else if (!input?.status) {
        conditions.push(eq(toolsTable.status, "active"))
      }

      if (input?.categoryId) {
        conditions.push(eq(toolsTable.categoryId, input.categoryId))
      }

      if (input?.search) {
        conditions.push(
          sql`(${ilike(toolsTable.name, `%${input.search}%`).getSQL()} OR ${ilike(toolsTable.description, `%${input.search}%`).getSQL()})`,
        )
      }

      const tools = await context.db
        .select({
          id: toolsTable.id,
          name: toolsTable.name,
          description: toolsTable.description,
          status: toolsTable.status,
          costPerRun: toolsTable.costPerRun,
          categoryId: toolsTable.categoryId,
          createdAt: toolsTable.createdAt,
        })
        .from(toolsTable)
        .where(and(...conditions))
        .orderBy(desc(toolsTable.createdAt))
        .limit(limit + 1)

      let nextCursor: string | undefined = undefined
      if (tools.length > limit) {
        const nextItem = tools.pop()
        nextCursor = nextItem?.id
      }

      return { tools, nextCursor }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select()
        .from(toolsTable)
        .where(eq(toolsTable.id, input.id))

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!tool) {
        throw new Error("Tool not found")
      }

      return tool
    }),

  getPopular: publicProcedure.handler(async ({ context }) => {
    const popular = await context.db
      .select({
        id: toolsTable.id,
        name: toolsTable.name,
        description: toolsTable.description,
        costPerRun: toolsTable.costPerRun,
        categoryId: toolsTable.categoryId,
      })
      .from(toolsTable)
      .where(eq(toolsTable.status, "active"))
      .limit(10)

    return popular
  }),

  getCategories: publicProcedure.handler(async ({ context }) => {
    return context.db
      .select()
      .from(categoriesTable)
      .orderBy(categoriesTable.sortOrder)
  }),

  getTags: publicProcedure.handler(async ({ context }) => {
    return context.db.select().from(tagsTable).orderBy(tagsTable.name)
  }),

  execute: protectedProcedure
    .input(
      z.object({
        toolId: z.string(),
        inputs: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select()
        .from(toolsTable)
        .where(eq(toolsTable.id, input.toolId))

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!tool) {
        throw new Error("Tool not found")
      }

      if (tool.status !== "active") {
        throw new Error("Tool is not available")
      }

      let [userCredits] = await context.db
        .select()
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, context.session.id))

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!userCredits) {
        const newCredits = {
          id: createCustomId(),
          userId: context.session.id,
          balance: "100",
          totalPurchased: "0",
          totalUsed: "0",
        }
        await context.db.insert(userCreditsTable).values(newCredits)
        userCredits = newCredits as typeof userCredits
      }

      const cost = Number(tool.costPerRun ?? 0)
      if (Number(userCredits.balance) < cost) {
        throw new Error("Insufficient credits")
      }

      const runId = createCustomId()
      const newRun = {
        id: runId,
        toolId: input.toolId,
        userId: context.session.id,
        inputs: input.inputs,
        status: "completed" as const,
        cost: String(cost),
        completedAt: new Date(),
      }
      await context.db.insert(toolRunsTable).values(newRun)

      await context.db
        .update(userCreditsTable)
        .set({
          balance: sql`${userCreditsTable.balance} - ${cost}`,
          totalUsed: sql`${userCreditsTable.totalUsed} + ${cost}`,
          updatedAt: new Date(),
        })
        .where(eq(userCreditsTable.userId, context.session.id))

      const newTransaction = {
        id: createCustomId(),
        userId: context.session.id,
        amount: String(-cost),
        type: "usage" as const,
        description: `Tool execution: ${tool.name}`,
        toolRunId: runId,
      }
      await context.db.insert(creditTransactionsTable).values(newTransaction)

      return {
        runId,
        output: "Tool executed successfully. AI integration pending.",
        cost,
      }
    }),

  create: protectedProcedure
    .input(insertToolSchema)
    .handler(async ({ context, input }) => {
      const id = createCustomId()
      const slug = await generateUniqueToolSlug(input.name)
      await context.db.insert(toolsTable).values({
        ...input,
        id,
        slug,
        createdBy: context.session.id,
      })
      return { id }
    }),

  update: protectedProcedure
    .input(updateToolSchema)
    .handler(async ({ context, input }) => {
      if (!input.id) {
        throw new Error("Tool ID is required")
      }
      const { id, ...data } = input

      // If name is being updated, regenerate slug
      let slug: string | undefined
      if (data.name) {
        const [existingTool] = await context.db
          .select()
          .from(toolsTable)
          .where(eq(toolsTable.id, id))

        if (existingTool.name !== data.name) {
          slug = await generateUniqueToolSlug(data.name)
        }
      }

      await context.db
        .update(toolsTable)
        .set({ ...data, ...(slug ? { slug } : {}), updatedAt: new Date() })
        .where(eq(toolsTable.id, id))
      return { success: true }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      await context.db.delete(toolsTable).where(eq(toolsTable.id, input.id))
      return { success: true }
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const [tool] = await context.db
        .select()
        .from(toolsTable)
        .where(eq(toolsTable.id, input.id))

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!tool) {
        throw new Error("Tool not found")
      }

      const newId = createCustomId()
      const duplicateName = `${tool.name} (Copy)`
      const slug = await generateUniqueToolSlug(duplicateName)
      const {
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        slug: _slug,
        ...toolData
      } = tool

      await context.db.insert(toolsTable).values({
        ...toolData,
        id: newId,
        name: duplicateName,
        slug,
        createdBy: context.session.id,
        status: "draft",
      })

      return { id: newId }
    }),

  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1),
        status: z.enum(["draft", "active", "archived"]),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.db
        .update(toolsTable)
        .set({ status: input.status, updatedAt: new Date() })
        .where(inArray(toolsTable.id, input.ids))

      return { success: true, count: input.ids.length }
    }),
}
