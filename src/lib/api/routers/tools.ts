import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { executeAITool } from "@/lib/ai/executor"
import { protectedProcedure, publicProcedure } from "@/lib/api/orpc"
import {
  adminSettingsTable,
  categoriesTable,
  creditTransactionsTable,
  insertToolSchema,
  tagsTable,
  toolRunsTable,
  toolsTable,
  updateToolSchema,
  userCreditsTable,
} from "@/lib/db/schema"
import type { ApiKeyConfig } from "@/lib/schemas/api-keys"
import { decryptApiKey } from "@/lib/utils/crypto"
import { createCustomId } from "@/lib/utils/custom-id"
import { generateUniqueToolSlug } from "@/lib/utils/slug"

const API_KEYS_SETTING_KEY = "api_keys"

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
    return await context.db
      .select()
      .from(categoriesTable)
      .orderBy(categoriesTable.sortOrder)
  }),

  getTags: publicProcedure.handler(async ({ context }) => {
    return await context.db.select().from(tagsTable).orderBy(tagsTable.name)
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

      if (tool === undefined) {
        throw new Error("Tool not found")
      }

      if (tool.status !== "active") {
        throw new Error("Tool is not available")
      }

      if (tool.apiKeyId === null) {
        throw new Error(
          "Tool is not configured with an API key. Please update the tool configuration.",
        )
      }

      const [adminSettings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY))

      if (!adminSettings?.settingValue) {
        throw new Error(
          "No API keys configured. Please add an API key in settings.",
        )
      }

      const apiKeys = adminSettings.settingValue as ApiKeyConfig[]
      const selectedKey = apiKeys.find((key) => key.id === tool.apiKeyId)

      if (!selectedKey) {
        throw new Error(
          "The API key configured for this tool no longer exists. Please update the tool configuration.",
        )
      }

      if (selectedKey.status !== "active") {
        throw new Error(
          "The API key configured for this tool is inactive. Please activate it in settings or select a different key.",
        )
      }

      let [userCredits] = await context.db
        .select()
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, context.session.id))

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

      const decryptedKey = decryptApiKey(selectedKey.apiKey)

      const toolConfig = tool.config as {
        modelEngine: string
        temperature: number
        maxTokens: number
      } | null

      if (toolConfig === null) {
        throw new Error("Tool configuration is missing")
      }

      let output: string
      try {
        const result = await executeAITool({
          systemRole: tool.systemRole ?? "",
          userInstructionTemplate: tool.userInstructionTemplate ?? "",
          inputs: input.inputs,
          config: toolConfig,
          outputFormat: tool.outputFormat ?? "plain",
          apiKey: decryptedKey,
          provider: selectedKey.provider,
        })
        output = result.output
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        await context.db.insert(toolRunsTable).values({
          id: runId,
          toolId: input.toolId,
          userId: context.session.id,
          inputs: input.inputs,
          outputs: { error: errorMessage },
          status: "failed" as const,
          cost: String(cost),
          completedAt: new Date(),
        })
        throw new Error(`AI execution failed: ${errorMessage}`)
      }

      const newRun = {
        id: runId,
        toolId: input.toolId,
        userId: context.session.id,
        inputs: input.inputs,
        outputs: { result: output },
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
        output,
        cost,
      }
    }),

  executePreview: protectedProcedure
    .input(
      z.object({
        systemRole: z.string(),
        userInstructionTemplate: z.string(),
        inputVariable: z.array(
          z.object({
            variableName: z.string(),
            type: z.enum([
              "text",
              "long_text",
              "number",
              "boolean",
              "select",
              "image",
              "video",
            ]),
            description: z.string(),
            options: z
              .array(
                z.object({
                  label: z.string(),
                  value: z.string(),
                }),
              )
              .optional(),
            isOptional: z.boolean().optional(),
          }),
        ),
        inputs: z.record(z.string(), z.string()),
        config: z.object({
          modelEngine: z.string(),
          temperature: z.number(),
          maxTokens: z.number(),
        }),
        outputFormat: z.enum(["plain", "json", "image", "video"]),
        apiKeyId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const requiredInputs = input.inputVariable.filter((v) => !v.isOptional)
      const missingInputs = requiredInputs
        .filter((v) => !input.inputs[v.variableName])
        .map((v) => v.variableName)

      if (missingInputs.length > 0) {
        throw new Error(`Missing required inputs: ${missingInputs.join(", ")}`)
      }

      if (!input.systemRole || input.systemRole.trim() === "") {
        throw new Error("System role is required")
      }
      if (
        !input.userInstructionTemplate ||
        input.userInstructionTemplate.trim() === ""
      ) {
        throw new Error("User instruction template is required")
      }

      if (!input.apiKeyId) {
        throw new Error("API key is required for preview execution")
      }

      const [adminSettings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY))

      if (!adminSettings?.settingValue) {
        throw new Error(
          "No API keys configured. Please add an API key in settings.",
        )
      }

      const apiKeys = adminSettings.settingValue as ApiKeyConfig[]
      const selectedKey = apiKeys.find((key) => key.id === input.apiKeyId)

      if (!selectedKey) {
        throw new Error("Selected API key not found")
      }

      if (selectedKey.status !== "active") {
        throw new Error("Selected API key is inactive")
      }

      const decryptedKey = decryptApiKey(selectedKey.apiKey)

      if (!decryptedKey.startsWith("sk-")) {
        throw new Error("Invalid OpenAI API key format")
      }

      try {
        const result = await executeAITool({
          systemRole: input.systemRole,
          userInstructionTemplate: input.userInstructionTemplate,
          inputs: input.inputs,
          config: input.config,
          outputFormat: input.outputFormat,
          apiKey: decryptedKey,
          provider: selectedKey.provider,
        })

        return {
          output: result.output,
          cost: 0,
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error("AI execution failed with an unknown error")
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
