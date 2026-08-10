// @vitest-environment jsdom

import { createRef } from "react"
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

import {
  ProductInputField,
  type ProductInputVariable,
} from "@/features/storefront/product-input-field"

vi.mock("ui/select", () => ({
  Select: ({
    children,
    value,
  }: {
    children: React.ReactNode
    value?: string
  }) => (
    <select data-testid="select" data-value={value}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  ),
  SelectPopup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
  }) => <option value={value}>{children}</option>,
}))

vi.mock("ui/checkbox", () => ({
  Checkbox: ({ checked }: { checked?: boolean }) => (
    <input type="checkbox" checked={Boolean(checked)} readOnly />
  ),
}))

let container: HTMLDivElement | null = null
let root: Root | null = null
const fileReaderRef = createRef<FileReader | null>()

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
})

const baseField: ProductInputVariable = {
  variableName: "prompt",
  description: "The prompt",
  type: "text",
}

const renderField = (field: Partial<ProductInputVariable>, value = "") => {
  const onChange = vi.fn()
  act(() => {
    root?.render(
      <ProductInputField
        field={{ ...baseField, ...field }}
        value={value}
        fileReaderRef={fileReaderRef}
        onChange={onChange}
      />,
    )
  })
  return onChange
}

describe("ProductInputField", () => {
  test("renders a text input for text fields", () => {
    renderField({ type: "text" })

    const input = container?.querySelector("input")
    expect(input).not.toBeNull()
    expect(input?.getAttribute("type")).not.toBe("file")
  })

  test("renders a textarea for long_text fields", () => {
    renderField({ type: "long_text" })

    expect(container?.querySelector("textarea")).not.toBeNull()
  })

  test("renders a number input for number fields", () => {
    renderField({ type: "number" })

    expect(container?.querySelector('input[type="number"]')).not.toBeNull()
  })

  test("renders a checkbox for boolean fields", () => {
    renderField({ type: "boolean" }, "true")

    expect(container?.querySelector('input[type="checkbox"]')).not.toBeNull()
  })

  test("renders a select with options for select fields", () => {
    renderField(
      {
        type: "select",
        options: [
          { label: "Option A", value: "a" },
          { label: "Option B", value: "b" },
        ],
      },
      "a",
    )

    const select = container?.querySelector('[data-testid="select"]')
    expect(select).not.toBeNull()
    expect(container?.textContent).toContain("Option A")
    expect(container?.textContent).toContain("Option B")
  })

  test("renders a file input for image fields", () => {
    renderField({ type: "image" })

    expect(container?.querySelector('input[type="file"]')).not.toBeNull()
  })

  test("passes the current value to the text input", () => {
    const onChange = vi.fn()
    act(() => {
      root?.render(
        <ProductInputField
          field={{ ...baseField, type: "text" }}
          value="hello"
          fileReaderRef={fileReaderRef}
          onChange={onChange}
        />,
      )
    })

    const input = container?.querySelector("input")
    expect(input?.getAttribute("value")).toBe("hello")
  })
})
