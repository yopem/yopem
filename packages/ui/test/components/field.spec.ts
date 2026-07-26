import { describe, expect, test } from "vite-plus/test"

import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldControl,
  FieldItem,
  FieldValidity,
} from "ui/components/field"

describe("field", () => {
  test("Field is exported", () => {
    expect(Field).toBeDefined()
  })

  test("FieldLabel is exported", () => {
    expect(FieldLabel).toBeDefined()
  })

  test("FieldDescription is exported", () => {
    expect(FieldDescription).toBeDefined()
  })

  test("FieldError is exported", () => {
    expect(FieldError).toBeDefined()
  })

  test("FieldControl is exported", () => {
    expect(FieldControl).toBeDefined()
  })

  test("FieldItem is exported", () => {
    expect(FieldItem).toBeDefined()
  })

  test("FieldValidity is exported", () => {
    expect(FieldValidity).toBeDefined()
  })
})
