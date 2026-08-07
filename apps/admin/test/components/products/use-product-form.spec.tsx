// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, useEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test"

import { useProductForm } from "@/components/products/use-product-form"

vi.mock("rpc/query", () => ({
  queryApi: {
    categories: {
      list: {
        useQuery: () => ({ data: { categories: [] } }),
        queryOptions: () => ({ queryKey: ["categories"], queryFn: vi.fn() }),
      },
      create: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
        mutationOptions: () => ({ mutationFn: vi.fn() }),
      },
    },
    tags: {
      list: {
        useQuery: () => ({ data: { tags: [] } }),
        queryOptions: () => ({ queryKey: ["tags"], queryFn: vi.fn() }),
      },
      create: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
        mutationOptions: () => ({ mutationFn: vi.fn() }),
      },
    },
    admin: {
      modelList: {
        useQuery: () => ({ data: { models: [] } }),
        queryOptions: () => ({ queryKey: ["models"], queryFn: vi.fn() }),
      },
    },
    settings: {
      aiModels: {
        useQuery: () => ({ data: { models: [] } }),
        queryOptions: () => ({ queryKey: ["aiModels"], queryFn: vi.fn() }),
      },
    },
  },
}))

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

describe("useProductForm", () => {
  test("initializes form state and handles category dialog visibility", () => {
    const queryClient = new QueryClient()
    let hookResult: ReturnType<typeof useProductForm> | null = null

    function TestComponent() {
      const form = useProductForm({
        mode: "create",
        onSubmit: () => undefined,
      })
      useEffect(() => {
        hookResult = form
      })
      return (
        <div data-testid="ready">
          {form.categoryDialogOpen ? "open" : "closed"}
        </div>
      )
    }

    act(() => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>,
      )
    })

    expect(hookResult).not.toBeNull()
    expect(container?.textContent).toBe("closed")

    act(() => {
      hookResult?.setCategoryDialogOpen(true)
    })

    expect(container?.textContent).toBe("open")
  })
})
