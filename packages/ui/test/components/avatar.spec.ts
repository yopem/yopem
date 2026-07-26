import { describe, expect, test } from "vitest"

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarPrimitive,
} from "ui/components/avatar"

describe("avatar", () => {
  test("Avatar is exported", () => {
    expect(Avatar).toBeDefined()
  })

  test("AvatarImage is exported", () => {
    expect(AvatarImage).toBeDefined()
  })

  test("AvatarFallback is exported", () => {
    expect(AvatarFallback).toBeDefined()
  })

  test("AvatarPrimitive is exported", () => {
    expect(AvatarPrimitive).toBeDefined()
  })
})
