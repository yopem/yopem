// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test"

import type { ProductWorkflow } from "db/schema/product-workflow"

import { WorkflowEditor } from "@/components/products/workflow-editor"

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {
      /* noop */
    }
    unobserve() {
      /* noop */
    }
    disconnect() {
      /* noop */
    }
  }
}

;(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  const currentRoot = root
  const currentContainer = container
  if (currentRoot && currentContainer) {
    act(() => currentRoot.unmount())
    document.body.removeChild(currentContainer)
  }
  container = null
  root = null
  vi.clearAllMocks()
})

describe("WorkflowEditor", () => {
  const workflow: ProductWorkflow = {
    nodes: [
      {
        id: "input_1",
        type: "input",
        position: { x: 50, y: 100 },
        data: {
          label: "User Input",
          fields: [
            { variableName: "prompt", description: "Prompt", type: "text" },
          ],
        },
      },
    ],
    edges: [],
  }

  test("renders workflow toolbar and node types", () => {
    act(() => {
      root?.render(
        <WorkflowEditor
          workflow={workflow}
          apiKeys={[]}
          availableModels={["gpt-4"]}
          onChange={() => undefined}
        />,
      )
    })

    expect(container?.textContent).toContain("Workflow")
    expect(container?.textContent).toContain("Input")
    expect(container?.textContent).toContain("AI Prompt")
    expect(container?.textContent).toContain("Output")
  })
})
