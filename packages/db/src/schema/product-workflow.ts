import * as v from "valibot"

export const inputFieldTypeSchema = v.picklist([
  "text",
  "long_text",
  "number",
  "boolean",
  "select",
  "image",
  "video",
])

export const selectOptionSchema = v.object({
  label: v.string(),
  value: v.string(),
})

export const inputFieldSchema = v.object({
  variableName: v.pipe(v.string(), v.minLength(1)),
  description: v.string(),
  type: inputFieldTypeSchema,
  options: v.optional(v.array(selectOptionSchema)),
  isOptional: v.optional(v.boolean()),
})

export const workflowNodeTypeSchema = v.picklist([
  "input",
  "ai",
  "output",
  "condition",
  "loop",
])

export const workflowPositionSchema = v.object({
  x: v.number(),
  y: v.number(),
})

const nodeBaseSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  position: workflowPositionSchema,
})

export const inputNodeSchema = v.object({
  ...nodeBaseSchema.entries,
  type: v.literal("input"),
  data: v.object({
    label: v.optional(v.string(), "User Input"),
    fields: v.pipe(v.array(inputFieldSchema), v.minLength(1)),
  }),
})

export const aiNodeSchema = v.object({
  ...nodeBaseSchema.entries,
  type: v.literal("ai"),
  data: v.object({
    label: v.optional(v.string(), "AI Step"),
    systemRole: v.string(),
    userInstructionTemplate: v.string(),
    outputName: v.pipe(v.string(), v.minLength(1)),
    outputFormat: v.optional(v.picklist(["plain", "json", "image", "video"])),
    modelEngine: v.optional(v.string()),
    apiKeyId: v.optional(v.string()),
  }),
})

export const outputNodeSchema = v.object({
  ...nodeBaseSchema.entries,
  type: v.literal("output"),
  data: v.object({
    label: v.optional(v.string(), "Output"),
    template: v.string(),
    outputName: v.pipe(v.string(), v.minLength(1)),
  }),
})

export const conditionNodeSchema = v.object({
  ...nodeBaseSchema.entries,
  type: v.literal("condition"),
  data: v.object({
    label: v.optional(v.string(), "Condition"),
    expression: v.string(),
  }),
})

export const loopNodeSchema = v.object({
  ...nodeBaseSchema.entries,
  type: v.literal("loop"),
  data: v.object({
    label: v.optional(v.string(), "Loop"),
    itemsExpression: v.string(),
    itemName: v.optional(v.string(), "item"),
    maxIterations: v.optional(
      v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
      10,
    ),
  }),
})

export const workflowNodeSchema = v.union([
  inputNodeSchema,
  aiNodeSchema,
  outputNodeSchema,
  conditionNodeSchema,
  loopNodeSchema,
])

export const workflowEdgeSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  source: v.pipe(v.string(), v.minLength(1)),
  target: v.pipe(v.string(), v.minLength(1)),
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
})

export const productWorkflowSchema = v.object({
  nodes: v.pipe(v.array(workflowNodeSchema), v.minLength(1)),
  edges: v.array(workflowEdgeSchema),
})

export type InputFieldType = v.InferOutput<typeof inputFieldTypeSchema>
export type InputField = v.InferOutput<typeof inputFieldSchema>
export type WorkflowNodeType = v.InferOutput<typeof workflowNodeTypeSchema>
export type InputNode = v.InferOutput<typeof inputNodeSchema>
export type AINode = v.InferOutput<typeof aiNodeSchema>
export type OutputNode = v.InferOutput<typeof outputNodeSchema>
export type ConditionNode = v.InferOutput<typeof conditionNodeSchema>
export type LoopNode = v.InferOutput<typeof loopNodeSchema>
export type WorkflowNode = v.InferOutput<typeof workflowNodeSchema>
export type WorkflowEdge = v.InferOutput<typeof workflowEdgeSchema>
export type ProductWorkflow = v.InferOutput<typeof productWorkflowSchema>
