import { describe, expect, test } from "vitest"

import {
  DialogCreateHandle,
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogBackdrop,
  DialogOverlay,
  DialogPopup,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogViewport,
} from "ui/components/dialog"

describe("dialog", () => {
  test("DialogCreateHandle is exported", () => {
    expect(DialogCreateHandle).toBeDefined()
  })

  test("Dialog is exported", () => {
    expect(Dialog).toBeDefined()
  })

  test("DialogTrigger is exported", () => {
    expect(DialogTrigger).toBeDefined()
  })

  test("DialogPortal is exported", () => {
    expect(DialogPortal).toBeDefined()
  })

  test("DialogClose is exported", () => {
    expect(DialogClose).toBeDefined()
  })

  test("DialogBackdrop is exported", () => {
    expect(DialogBackdrop).toBeDefined()
  })

  test("DialogOverlay is exported", () => {
    expect(DialogOverlay).toBeDefined()
  })

  test("DialogPopup is exported", () => {
    expect(DialogPopup).toBeDefined()
  })

  test("DialogContent is exported", () => {
    expect(DialogContent).toBeDefined()
  })

  test("DialogHeader is exported", () => {
    expect(DialogHeader).toBeDefined()
  })

  test("DialogFooter is exported", () => {
    expect(DialogFooter).toBeDefined()
  })

  test("DialogTitle is exported", () => {
    expect(DialogTitle).toBeDefined()
  })

  test("DialogDescription is exported", () => {
    expect(DialogDescription).toBeDefined()
  })

  test("DialogPanel is exported", () => {
    expect(DialogPanel).toBeDefined()
  })

  test("DialogViewport is exported", () => {
    expect(DialogViewport).toBeDefined()
  })
})
