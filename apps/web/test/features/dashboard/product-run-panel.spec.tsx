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

import { ProductRunPanel } from "@/features/dashboard/product-run-panel"

const { mockMutation, formState } = vi.hoisted(() => {
  const mockMutation = {
    isPending: false,
    mutate: vi.fn(),
    onSuccess: null as null | ((data: unknown) => void),
    onError: null as null | ((err: { message?: string }) => void),
  }
  const formState = {
    values: {} as Record<string, string>,
    onSubmit: null as
      | null
      | ((args: { value: Record<string, string> }) => void),
  }
  return { mockMutation, formState }
})

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    onSuccess?: (data: unknown) => void
    onError?: (err: { message?: string }) => void
  }) => {
    mockMutation.onSuccess = options.onSuccess ?? null
    mockMutation.onError = options.onError ?? null
    return mockMutation
  },
}))

vi.mock("@tanstack/react-form", () => ({
  useForm: (options: {
    onSubmit: (args: { value: Record<string, string> }) => void
  }) => {
    formState.onSubmit = options.onSubmit
    return {
      handleSubmit: () => formState.onSubmit?.({ value: formState.values }),
      Field: ({
        name,
        children,
      }: {
        name: string
        children: (field: {
          state: { value: string }
          handleChange: (value: string) => void
        }) => React.ReactNode
      }) =>
        children({
          state: { value: formState.values[name] ?? "" },
          handleChange: (value: string) => {
            formState.values[name] = value
          },
        }),
    }
  },
}))

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  mockMutation.mutate.mockClear()
  mockMutation.isPending = false
  formState.values = {}
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
})

const product = {
  id: "prod_1",
  name: "Test Product",
  creditsPerRun: 5,
  outputFormat: "plain",
  workflow: {
    nodes: [
      {
        type: "input",
        data: {
          fields: [
            { variableName: "prompt", description: "The prompt", type: "text" },
          ],
        },
      },
    ],
  },
}

const renderPanel = () => {
  act(() => {
    root?.render(<ProductRunPanel product={product} />)
  })
}

describe("ProductRunPanel", () => {
  test("renders input fields from the product workflow", () => {
    renderPanel()

    expect(container?.textContent).toContain("The prompt")
    expect(container?.querySelector("input")).not.toBeNull()
  })

  test("submitting the form runs the product with the input values", () => {
    renderPanel()
    formState.values.prompt = "hello world"

    const submitButton = container?.querySelector('button[type="submit"]')
    act(() => {
      submitButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      )
    })

    expect(mockMutation.mutate).toHaveBeenCalledWith({
      id: "prod_1",
      inputs: { prompt: "hello world" },
    })
  })

  test("renders the result on success", () => {
    renderPanel()

    act(() => {
      mockMutation.onSuccess?.({ output: "Generated result" })
    })

    expect(container?.textContent).toContain("Generated result")
    expect(container?.textContent).toContain("Execution Output")
  })

  test("renders an error message on failure", () => {
    renderPanel()

    act(() => {
      mockMutation.onError?.({ message: "Something went wrong" })
    })

    expect(container?.textContent).toContain("Execution Failed")
    expect(container?.textContent).toContain("Something went wrong")
  })
})
