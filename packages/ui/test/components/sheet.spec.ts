import { describe, expect, test } from "vitest"

import {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetBackdrop,
  SheetOverlay,
  SheetPopup,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetPanel,
} from "ui/components/sheet"

describe("sheet", () => {
  test("Sheet is exported", () => {
    expect(Sheet).toBeDefined()
  })

  test("SheetTrigger is exported", () => {
    expect(SheetTrigger).toBeDefined()
  })

  test("SheetPortal is exported", () => {
    expect(SheetPortal).toBeDefined()
  })

  test("SheetClose is exported", () => {
    expect(SheetClose).toBeDefined()
  })

  test("SheetBackdrop is exported", () => {
    expect(SheetBackdrop).toBeDefined()
  })

  test("SheetOverlay is exported", () => {
    expect(SheetOverlay).toBeDefined()
  })

  test("SheetPopup is exported", () => {
    expect(SheetPopup).toBeDefined()
  })

  test("SheetContent is exported", () => {
    expect(SheetContent).toBeDefined()
  })

  test("SheetHeader is exported", () => {
    expect(SheetHeader).toBeDefined()
  })

  test("SheetFooter is exported", () => {
    expect(SheetFooter).toBeDefined()
  })

  test("SheetTitle is exported", () => {
    expect(SheetTitle).toBeDefined()
  })

  test("SheetDescription is exported", () => {
    expect(SheetDescription).toBeDefined()
  })

  test("SheetPanel is exported", () => {
    expect(SheetPanel).toBeDefined()
  })
})
