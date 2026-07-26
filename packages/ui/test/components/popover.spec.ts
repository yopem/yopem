import { describe, expect, test } from "vitest"

import {
  PopoverTrigger,
  PopoverPopup,
  PopoverClose,
  PopoverTitle,
  PopoverDescription,
  PopoverCreateHandle,
  Popover,
  PopoverPrimitive,
  PopoverContent,
} from "ui/components/popover"

describe("popover", () => {
  test("PopoverTrigger is exported", () => {
    expect(PopoverTrigger).toBeDefined()
  })

  test("PopoverPopup is exported", () => {
    expect(PopoverPopup).toBeDefined()
  })

  test("PopoverClose is exported", () => {
    expect(PopoverClose).toBeDefined()
  })

  test("PopoverTitle is exported", () => {
    expect(PopoverTitle).toBeDefined()
  })

  test("PopoverDescription is exported", () => {
    expect(PopoverDescription).toBeDefined()
  })

  test("PopoverCreateHandle is exported", () => {
    expect(PopoverCreateHandle).toBeDefined()
  })

  test("Popover is exported", () => {
    expect(Popover).toBeDefined()
  })

  test("PopoverPrimitive is exported", () => {
    expect(PopoverPrimitive).toBeDefined()
  })

  test("PopoverContent is exported", () => {
    expect(PopoverContent).toBeDefined()
  })
})
