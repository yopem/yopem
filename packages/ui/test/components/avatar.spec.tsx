import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/avatar"

describe("ui/components/avatar", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Avatar).toBeDefined()
    expect(mod.AvatarImage).toBeDefined()
    expect(mod.AvatarFallback).toBeDefined()
    expect(mod.AvatarPrimitive).toBeDefined()
  })
})
