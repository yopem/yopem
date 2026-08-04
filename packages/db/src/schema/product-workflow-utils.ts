import type { ProductWorkflow, WorkflowNode } from "./product-workflow"

export function getInputFieldsFromWorkflow(
  workflow: ProductWorkflow | null | undefined,
) {
  if (!workflow) return []
  return workflow.nodes
    .filter(
      (n): n is Extract<(typeof workflow.nodes)[number], { type: "input" }> =>
        n.type === "input",
    )
    .flatMap((n) => n.data.fields)
}

export function getWorkflowOutputNames(workflow: ProductWorkflow) {
  const names: string[] = []
  for (const node of workflow.nodes) {
    if (node.type === "ai") names.push(node.data.outputName)
    if (node.type === "output") names.push(node.data.outputName)
  }
  return names
}

export function createDefaultWorkflow(
  _productName: string,
  outputFormat: "plain" | "json" | "image" | "video" = "plain",
): ProductWorkflow {
  return {
    nodes: [
      {
        id: "input_1",
        type: "input",
        position: { x: 50, y: 150 },
        data: {
          label: "User Input",
          fields: [
            {
              variableName: "topic",
              description: "What the user wants to generate",
              type: "text",
            },
          ],
        },
      },
      {
        id: "ai_1",
        type: "ai",
        position: { x: 350, y: 150 },
        data: {
          label: "AI Step",
          systemRole: "You are a helpful assistant.",
          userInstructionTemplate: "Help with: {{topic}}",
          outputName: "result",
          outputFormat,
        },
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 650, y: 150 },
        data: {
          label: "Output",
          template: "{{result}}",
          outputName: "finalOutput",
        },
      },
    ],
    edges: [
      { id: "e1", source: "input_1", target: "ai_1" },
      { id: "e2", source: "ai_1", target: "output_1" },
    ],
  }
}

export function findNodeById(
  workflow: ProductWorkflow,
  id: string,
): WorkflowNode | undefined {
  return workflow.nodes.find((n) => n.id === id)
}
