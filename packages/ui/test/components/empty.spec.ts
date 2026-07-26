import { describe, expect, test } from "vite-plus/test"

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "ui/components/empty"

describe("empty", () => {
  test("Empty is exported", () => {
    expect(Empty).toBeDefined()
  })

  test("EmptyHeader is exported", () => {
    expect(EmptyHeader).toBeDefined()
  })

  test("EmptyTitle is exported", () => {
    expect(EmptyTitle).toBeDefined()
  })

  test("EmptyDescription is exported", () => {
    expect(EmptyDescription).toBeDefined()
  })

  test("EmptyContent is exported", () => {
    expect(EmptyContent).toBeDefined()
  })

  test("EmptyMedia is exported", () => {
    expect(EmptyMedia).toBeDefined()
  })
})
