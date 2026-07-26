import { describe, expect, test } from "vite-plus/test"

import {
  AlertDialogCreateHandle,
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
  AlertDialogViewport,
} from "ui/components/alert-dialog"

describe("alert-dialog", () => {
  test("AlertDialogCreateHandle is exported", () => {
    expect(AlertDialogCreateHandle).toBeDefined()
  })

  test("AlertDialog is exported", () => {
    expect(AlertDialog).toBeDefined()
  })

  test("AlertDialogPortal is exported", () => {
    expect(AlertDialogPortal).toBeDefined()
  })

  test("AlertDialogBackdrop is exported", () => {
    expect(AlertDialogBackdrop).toBeDefined()
  })

  test("AlertDialogOverlay is exported", () => {
    expect(AlertDialogOverlay).toBeDefined()
  })

  test("AlertDialogTrigger is exported", () => {
    expect(AlertDialogTrigger).toBeDefined()
  })

  test("AlertDialogPopup is exported", () => {
    expect(AlertDialogPopup).toBeDefined()
  })

  test("AlertDialogContent is exported", () => {
    expect(AlertDialogContent).toBeDefined()
  })

  test("AlertDialogHeader is exported", () => {
    expect(AlertDialogHeader).toBeDefined()
  })

  test("AlertDialogFooter is exported", () => {
    expect(AlertDialogFooter).toBeDefined()
  })

  test("AlertDialogTitle is exported", () => {
    expect(AlertDialogTitle).toBeDefined()
  })

  test("AlertDialogDescription is exported", () => {
    expect(AlertDialogDescription).toBeDefined()
  })

  test("AlertDialogClose is exported", () => {
    expect(AlertDialogClose).toBeDefined()
  })

  test("AlertDialogViewport is exported", () => {
    expect(AlertDialogViewport).toBeDefined()
  })
})
