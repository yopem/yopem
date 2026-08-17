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

import { AIModelsSettings } from "@/features/settings/ai-model-settings"

const mockModels = [
  {
    id: "m1",
    provider: "openai",
    modelId: "gpt-4o",
    displayName: "GPT-4o",
    isEnabled: true,
  },
]

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: () => ({ data: mockModels, isLoading: false }),
  useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
}))

vi.mock("rpc/query", () => ({
  queryApi: {
    admin: {
      modelList: { queryOptions: vi.fn(), queryKey: vi.fn() },
      modelDelete: { mutationOptions: vi.fn() },
      modelCreate: { mutationOptions: vi.fn() },
      modelUpdate: { mutationOptions: vi.fn() },
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

describe("AIModelsSettings", () => {
  test("renders AI Models heading and model list items", () => {
    act(() => {
      root?.render(<AIModelsSettings />)
    })

    expect(container?.textContent).toContain("AI Models")
    expect(container?.textContent).toContain("GPT-4o")
    expect(container?.textContent).toContain("openai / gpt-4o")
    expect(container?.textContent).toContain("Add New Model")
  })
})
