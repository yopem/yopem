import { describe, expect, test } from "vitest"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectGroup,
  SelectGroupLabel,
} from "ui/components/select"

describe("select", () => {
  test("Select is exported", () => {
    expect(Select).toBeDefined()
  })

  test("SelectTrigger is exported", () => {
    expect(SelectTrigger).toBeDefined()
  })

  test("SelectValue is exported", () => {
    expect(SelectValue).toBeDefined()
  })

  test("SelectPopup is exported", () => {
    expect(SelectPopup).toBeDefined()
  })

  test("SelectContent is exported", () => {
    expect(SelectContent).toBeDefined()
  })

  test("SelectItem is exported", () => {
    expect(SelectItem).toBeDefined()
  })

  test("SelectSeparator is exported", () => {
    expect(SelectSeparator).toBeDefined()
  })

  test("SelectGroup is exported", () => {
    expect(SelectGroup).toBeDefined()
  })

  test("SelectGroupLabel is exported", () => {
    expect(SelectGroupLabel).toBeDefined()
  })
})
