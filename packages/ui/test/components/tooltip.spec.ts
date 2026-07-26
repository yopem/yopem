import { describe, expect, test } from "vitest"

import {
  TooltipCreateHandle,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
  TooltipContent,
} from "ui/components/tooltip"

describe("tooltip", () => {
  test("TooltipCreateHandle is exported", () => {
    expect(TooltipCreateHandle).toBeDefined()
  })

  test("TooltipProvider is exported", () => {
    expect(TooltipProvider).toBeDefined()
  })

  test("Tooltip is exported", () => {
    expect(Tooltip).toBeDefined()
  })

  test("TooltipTrigger is exported", () => {
    expect(TooltipTrigger).toBeDefined()
  })

  test("TooltipPopup is exported", () => {
    expect(TooltipPopup).toBeDefined()
  })

  test("TooltipContent is exported", () => {
    expect(TooltipContent).toBeDefined()
  })
})
