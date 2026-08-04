import { executeWorkflow } from "server/llm/workflow"
import { describe, expect, test } from "vite-plus/test"

import type { ProductWorkflow } from "db/schema"

const workflow: ProductWorkflow = {
  nodes: [
    {
      id: "input_1",
      type: "input",
      position: { x: 0, y: 0 },
      data: {
        label: "Input",
        fields: [
          {
            variableName: "topic",
            description: "Topic",
            type: "text",
          },
        ],
      },
    },
    {
      id: "cond_1",
      type: "condition",
      position: { x: 200, y: 0 },
      data: {
        label: "Condition",
        expression: "'{{topic}}' == \"a\"",
      },
    },
    {
      id: "out_true",
      type: "output",
      position: { x: 400, y: -50 },
      data: {
        label: "True output",
        template: "yes",
        outputName: "trueOutput",
      },
    },
    {
      id: "out_false",
      type: "output",
      position: { x: 400, y: 50 },
      data: {
        label: "False output",
        template: "no",
        outputName: "falseOutput",
      },
    },
  ],
  edges: [
    { id: "e1", source: "input_1", target: "cond_1" },
    {
      id: "e_true",
      source: "cond_1",
      target: "out_true",
      sourceHandle: "true",
    },
    {
      id: "e_false",
      source: "cond_1",
      target: "out_false",
      sourceHandle: "false",
    },
  ],
}

describe("executeWorkflow", () => {
  test("routes condition true branch", async () => {
    const result = await executeWorkflow({
      workflow,
      inputs: { topic: "a" },
      productConfig: { modelEngine: "" },
      productApiKeyId: null,
      apiKeys: [],
    })

    expect(
      result.steps.some(
        (step) => step.nodeId === "out_true" && step.value === "yes",
      ),
    ).toBe(true)
    expect(result.steps.some((step) => step.nodeId === "out_false")).toBe(false)
  })

  test("routes condition false branch", async () => {
    const result = await executeWorkflow({
      workflow,
      inputs: { topic: "b" },
      productConfig: { modelEngine: "" },
      productApiKeyId: null,
      apiKeys: [],
    })

    expect(
      result.steps.some(
        (step) => step.nodeId === "out_false" && step.value === "no",
      ),
    ).toBe(true)
    expect(result.steps.some((step) => step.nodeId === "out_true")).toBe(false)
  })
})
