import { describe, expect, test } from "vite-plus/test"

import * as mod from "auth/roles"

describe("packages/auth/roles", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ROLES).toBeDefined()
    expect(mod.roleSchema).toBeDefined()
  })
})
