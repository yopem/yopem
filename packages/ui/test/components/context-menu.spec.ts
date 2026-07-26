import { describe, expect, test } from "vite-plus/test"

import {
  ContextMenuTrigger,
  ContextMenuPopup,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLinkItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuGroupLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubPopup,
  ContextMenu,
  ContextMenuPortal,
  ContextMenuPrimitive,
} from "ui/components/context-menu"

describe("context-menu", () => {
  test("ContextMenuTrigger is exported", () => {
    expect(ContextMenuTrigger).toBeDefined()
  })

  test("ContextMenuPopup is exported", () => {
    expect(ContextMenuPopup).toBeDefined()
  })

  test("ContextMenuGroup is exported", () => {
    expect(ContextMenuGroup).toBeDefined()
  })

  test("ContextMenuItem is exported", () => {
    expect(ContextMenuItem).toBeDefined()
  })

  test("ContextMenuLinkItem is exported", () => {
    expect(ContextMenuLinkItem).toBeDefined()
  })

  test("ContextMenuCheckboxItem is exported", () => {
    expect(ContextMenuCheckboxItem).toBeDefined()
  })

  test("ContextMenuRadioGroup is exported", () => {
    expect(ContextMenuRadioGroup).toBeDefined()
  })

  test("ContextMenuRadioItem is exported", () => {
    expect(ContextMenuRadioItem).toBeDefined()
  })

  test("ContextMenuGroupLabel is exported", () => {
    expect(ContextMenuGroupLabel).toBeDefined()
  })

  test("ContextMenuSeparator is exported", () => {
    expect(ContextMenuSeparator).toBeDefined()
  })

  test("ContextMenuShortcut is exported", () => {
    expect(ContextMenuShortcut).toBeDefined()
  })

  test("ContextMenuSub is exported", () => {
    expect(ContextMenuSub).toBeDefined()
  })

  test("ContextMenuSubTrigger is exported", () => {
    expect(ContextMenuSubTrigger).toBeDefined()
  })

  test("ContextMenuSubPopup is exported", () => {
    expect(ContextMenuSubPopup).toBeDefined()
  })

  test("ContextMenu is exported", () => {
    expect(ContextMenu).toBeDefined()
  })

  test("ContextMenuPortal is exported", () => {
    expect(ContextMenuPortal).toBeDefined()
  })

  test("ContextMenuPrimitive is exported", () => {
    expect(ContextMenuPrimitive).toBeDefined()
  })
})
