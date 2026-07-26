import { describe, expect, test } from "vitest"

import {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarInput,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarPrimitive,
} from "ui/components/toolbar"

describe("toolbar", () => {
  test("Toolbar is exported", () => {
    expect(Toolbar).toBeDefined()
  })

  test("ToolbarButton is exported", () => {
    expect(ToolbarButton).toBeDefined()
  })

  test("ToolbarLink is exported", () => {
    expect(ToolbarLink).toBeDefined()
  })

  test("ToolbarInput is exported", () => {
    expect(ToolbarInput).toBeDefined()
  })

  test("ToolbarGroup is exported", () => {
    expect(ToolbarGroup).toBeDefined()
  })

  test("ToolbarSeparator is exported", () => {
    expect(ToolbarSeparator).toBeDefined()
  })

  test("ToolbarPrimitive is exported", () => {
    expect(ToolbarPrimitive).toBeDefined()
  })
})
