import { z } from "zod"

export const inputFieldTypeSchema = z.enum([
  "text",
  "long_text",
  "number",
  "boolean",
  "select",
  "image",
  "video",
])

export const selectOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const inputFieldSchema = z.object({
  variableName: z.string().min(1),
  description: z.string(),
  type: inputFieldTypeSchema,
  options: z.array(selectOptionSchema).optional(),
  isOptional: z.boolean().optional(),
})

export const workflowNodeTypeSchema = z.enum([
  "input",
  "ai",
  "output",
  "condition",
  "loop",
])

export const workflowPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const nodeBaseSchema = z.object({
  id: z.string().min(1),
  position: workflowPositionSchema,
})

export const inputNodeSchema = nodeBaseSchema.extend({
  type: z.literal("input"),
  data: z.object({
    label: z.string().default("User Input"),
    fields: z.array(inputFieldSchema).min(1),
  }),
})

export const aiNodeSchema = nodeBaseSchema.extend({
  type: z.literal("ai"),
  data: z.object({
    label: z.string().default("AI Step"),
    systemRole: z.string(),
    userInstructionTemplate: z.string(),
    outputName: z.string().min(1),
    outputFormat: z.enum(["plain", "json", "image", "video"]).optional(),
    modelEngine: z.string().optional(),
    apiKeyId: z.string().optional(),
  }),
})

export const outputNodeSchema = nodeBaseSchema.extend({
  type: z.literal("output"),
  data: z.object({
    label: z.string().default("Output"),
    template: z.string(),
    outputName: z.string().min(1),
  }),
})

export const conditionNodeSchema = nodeBaseSchema.extend({
  type: z.literal("condition"),
  data: z.object({
    label: z.string().default("Condition"),
    expression: z.string(),
  }),
})

export const loopNodeSchema = nodeBaseSchema.extend({
  type: z.literal("loop"),
  data: z.object({
    label: z.string().default("Loop"),
    itemsExpression: z.string(),
    itemName: z.string().default("item"),
    maxIterations: z.number().int().min(1).max(100).default(10),
  }),
})

export const workflowNodeSchema = z.union([
  inputNodeSchema,
  aiNodeSchema,
  outputNodeSchema,
  conditionNodeSchema,
  loopNodeSchema,
])

export const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
})

export const productWorkflowSchema = z.object({
  nodes: z.array(workflowNodeSchema).min(1),
  edges: z.array(workflowEdgeSchema),
})

export type InputFieldType = z.infer<typeof inputFieldTypeSchema>
export type InputField = z.infer<typeof inputFieldSchema>
export type WorkflowNodeType = z.infer<typeof workflowNodeTypeSchema>
export type InputNode = z.infer<typeof inputNodeSchema>
export type AINode = z.infer<typeof aiNodeSchema>
export type OutputNode = z.infer<typeof outputNodeSchema>
export type ConditionNode = z.infer<typeof conditionNodeSchema>
export type LoopNode = z.infer<typeof loopNodeSchema>
export type WorkflowNode = z.infer<typeof workflowNodeSchema>
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>
export type ProductWorkflow = z.infer<typeof productWorkflowSchema>
