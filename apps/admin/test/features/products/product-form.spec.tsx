// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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

import { ProductForm } from "@/features/products/product-form"

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
    assets: {
      list: {
        useQuery: () => ({ data: { assets: [] } }),
        queryOptions: () => ({ queryKey: ["assets"], queryFn: vi.fn() }),
      },
    },
  },
}))

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
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

describe("ProductForm", () => {
  test("renders form steps and product name input", () => {
    const queryClient = new QueryClient()

    act(() => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <ProductForm mode="create" onSubmit={() => undefined} />
        </QueryClientProvider>,
      )
    })

    expect(container?.textContent).toContain("Basics")
    expect(container?.textContent).toContain("Workflow")
    expect(container?.textContent).toContain("Configure")
    expect(container?.textContent).toContain("Product Name")

    const nameInput = container?.querySelector(
      'input[placeholder="Enter product name"]',
    )
    expect(nameInput).not.toBeNull()
  })
})
