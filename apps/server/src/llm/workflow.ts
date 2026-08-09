import { ORPCError } from "@orpc/server"
import { decryptApiKey } from "server/lib/crypto"
import * as v from "valibot"

import type { ProductWorkflow, WorkflowNode } from "db/schema/product-workflow"
import { findAIModelByProviderAndModelId } from "db/services/admin"
import type { ApiKeyConfig, ApiKeyProvider } from "utils/api-input"
import { apiKeyProviderSchema } from "utils/api-input"

import { executeAIProduct } from "./executor"

export interface WorkflowStepOutput {
  nodeId: string
  outputName: string
  value: string
  status: "idle" | "running" | "completed" | "failed"
  error?: string
}

export interface WorkflowExecutionResult {
  finalOutput: string
  finalOutputName: string
  steps: WorkflowStepOutput[]
}

interface WorkflowExecutorContext {
  workflow: ProductWorkflow
  inputs: Record<string, unknown>
  productConfig: {
    modelEngine: string
    outputFormat?: "plain" | "json" | "image" | "video"
  }
  productApiKeyId: string | null
  apiKeys: ApiKeyConfig[]
}

function formatValue(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "object") return JSON.stringify(value)
  // oxlint-disable-next-line typescript/no-base-to-string -- value is narrowed to primitive by the checks above
  return String(value)
}

function replaceVariables(
  template: string,
  variables: Record<string, unknown>,
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    result = result.replaceAll(placeholder, formatValue(value))
  }
  return result
}

function topologicalSort(
  nodes: WorkflowNode[],
  edges: { source: string; target: string }[],
): string[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source) ?? []
    neighbors.push(edge.target)
    adjacency.set(edge.source, neighbors)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id)
  }

  const result: string[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    result.push(id)
    for (const neighbor of adjacency.get(id) ?? []) {
      const nextDegree = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, nextDegree)
      if (nextDegree === 0) queue.push(neighbor)
    }
  }

  if (result.length !== nodes.length) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: "Workflow contains a cycle or disconnected nodes",
    })
  }

  return result
}

const getNodesById = (nodes: WorkflowNode[]): Map<string, WorkflowNode> =>
  new Map(nodes.map((node) => [node.id, node]))

type AINode = Extract<WorkflowNode, { type: "ai" }>
type OutputNode = Extract<WorkflowNode, { type: "output" }>

async function resolveKeyAndModel(
  node: AINode,
  context: WorkflowExecutorContext,
): Promise<{ apiKey: string; provider: ApiKeyProvider; modelEngine: string }> {
  const modelEngine = node.data.modelEngine ?? context.productConfig.modelEngine

  const apiKeyId = node.data.apiKeyId ?? context.productApiKeyId
  if (!apiKeyId) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `AI step "${node.data.label}" has no API key configured`,
    })
  }

  const key = context.apiKeys.find((k) => k.id === apiKeyId)
  if (!key) {
    throw new ORPCError("NOT_FOUND", {
      status: 404,
      message: `API key "${apiKeyId}" not found for step "${node.data.label}"`,
    })
  }

  if (key.status !== "active") {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `API key "${key.id}" is inactive`,
    })
  }

  const parsedProvider = v.safeParse(apiKeyProviderSchema, key.provider)
  if (!parsedProvider.success) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      status: 500,
      message: `API key "${key.id}" has invalid provider`,
    })
  }

  const provider = parsedProvider.output

  const decryptedKey = decryptApiKey(key.apiKey).trim()
  if (!decryptedKey) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      status: 500,
      message: `Failed to decrypt API key "${key.id}"`,
    })
  }

  const model = await findAIModelByProviderAndModelId(provider, modelEngine)
  if (!model) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `Model "${modelEngine}" not configured for provider "${provider}"`,
    })
  }

  if (!model.isEnabled) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `Model "${modelEngine}" is disabled`,
    })
  }

  return { apiKey: decryptedKey, provider, modelEngine }
}

function substituteVariableReferences(expression: string): string {
  return expression.replace(
    /(['"])\{\{([^}]+)\}\}\1|\{\{([^}]+)\}\}/g,
    (
      _,
      _quote: string | undefined,
      quotedKey: string | undefined,
      bareKey: string | undefined,
    ) => `vars[${JSON.stringify((quotedKey ?? bareKey ?? "").trim())}]`,
  )
}

function evaluateExpression(
  expression: string,
  variables: Record<string, unknown>,
): unknown {
  try {
    // oxlint-disable-next-line typescript/no-implied-eval -- deliberate sandboxed expression evaluation for workflow conditions
    const fn = new Function(
      "vars",
      `with(vars) { return ${substituteVariableReferences(expression)}; }`,
    )
    return fn({ ...variables })
  } catch {
    return undefined
  }
}

function evaluateCondition(
  expression: string,
  variables: Record<string, unknown>,
): boolean {
  return Boolean(evaluateExpression(expression, variables))
}

function evaluateLoopItems(
  itemsExpression: string,
  variables: Record<string, unknown>,
): unknown[] {
  const result = evaluateExpression(itemsExpression, variables)
  return Array.isArray(result) ? result : []
}

async function runAIStep(
  node: AINode,
  variables: Record<string, unknown>,
  context: WorkflowExecutorContext,
): Promise<string> {
  const { apiKey, provider, modelEngine } = await resolveKeyAndModel(
    node,
    context,
  )
  const systemRole = replaceVariables(node.data.systemRole, variables)
  const userInstruction = replaceVariables(
    node.data.userInstructionTemplate,
    variables,
  )
  const outputFormat =
    node.data.outputFormat ?? context.productConfig.outputFormat ?? "plain"

  const response = await executeAIProduct({
    systemRole,
    userInstructionTemplate: userInstruction,
    config: { modelEngine },
    outputFormat,
    apiKey,
    provider,
  })
  return response.output
}

export async function executeWorkflow(
  context: WorkflowExecutorContext,
): Promise<WorkflowExecutionResult> {
  const { workflow, inputs } = context
  const variables: Record<string, unknown> = { ...inputs }
  const outputs: Record<string, string> = {}
  const steps: WorkflowStepOutput[] = []

  const sortedIds = topologicalSort(workflow.nodes, workflow.edges)
  const nodesById = getNodesById(workflow.nodes)
  const activeIds = new Set(sortedIds)
  const deadIds = new Set<string>()

  for (const nodeId of sortedIds) {
    if (!activeIds.has(nodeId)) continue

    const incomingEdges = workflow.edges.filter((e) => e.target === nodeId)
    const allUpstreamDead =
      incomingEdges.length > 0 &&
      incomingEdges.every((e) => deadIds.has(e.source))
    if (allUpstreamDead) {
      deadIds.add(nodeId)
      continue
    }

    const node = nodesById.get(nodeId)
    if (!node) continue

    const baseStep = (name: string): WorkflowStepOutput => ({
      nodeId: node.id,
      outputName: name,
      value: "",
      status: "running",
    })

    switch (node.type) {
      case "input": {
        for (const field of node.data.fields) {
          outputs[field.variableName] = formatValue(
            variables[field.variableName],
          )
        }
        steps.push({ ...baseStep("inputs"), value: "", status: "completed" })
        break
      }

      case "output": {
        const value = replaceVariables(node.data.template, variables)
        outputs[node.data.outputName] = value
        variables[node.data.outputName] = value
        steps.push({
          ...baseStep(node.data.outputName),
          value,
          status: "completed",
        })
        break
      }

      case "condition": {
        const matched = evaluateCondition(node.data.expression, variables)
        variables[`${node.id}_result`] = matched ? "true" : "false"
        steps.push({
          ...baseStep("condition"),
          value: matched ? "true" : "false",
          status: "completed",
        })

        const outgoing = workflow.edges.filter((e) => e.source === node.id)
        for (const edge of outgoing) {
          const branchMatches =
            edge.sourceHandle === "true"
              ? matched
              : edge.sourceHandle === "false"
                ? !matched
                : edge.sourceHandle
                  ? evaluateCondition(edge.sourceHandle, variables)
                  : matched
          if (!branchMatches) {
            activeIds.delete(edge.target)
            deadIds.add(edge.target)
          }
        }
        break
      }

      case "loop": {
        const items = evaluateLoopItems(
          node.data.itemsExpression,
          variables,
        ).slice(0, node.data.maxIterations)
        const results: string[] = []

        for (const item of items) {
          variables[node.data.itemName] = item
          const outgoing = workflow.edges.filter((e) => e.source === node.id)
          for (const edge of outgoing) {
            const subNode = nodesById.get(edge.target)
            if (subNode?.type !== "ai") continue
            const out = await runAIStep(subNode, variables, context)
            results.push(out)
            activeIds.delete(edge.target)
          }
        }

        const joined = results.join("\n\n")
        outputs[`${node.id}_result`] = joined
        variables[`${node.id}_result`] = joined
        steps.push({
          ...baseStep("loop"),
          value: joined,
          status: "completed",
        })
        break
      }

      case "ai": {
        const out = await runAIStep(node, variables, context)
        outputs[node.data.outputName] = out
        variables[node.data.outputName] = out
        steps.push({
          ...baseStep(node.data.outputName),
          value: out,
          status: "completed",
        })
        break
      }
    }
  }

  const outputNodes = workflow.nodes.filter(
    (n): n is OutputNode => n.type === "output",
  )
  const finalNode = outputNodes[outputNodes.length - 1]
  if (!finalNode) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: "Workflow must contain at least one output node",
    })
  }

  return {
    finalOutput: outputs[finalNode.data.outputName] ?? "",
    finalOutputName: finalNode.data.outputName,
    steps,
  }
}
