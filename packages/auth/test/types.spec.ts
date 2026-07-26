import { describe, expect, test } from "vite-plus/test"

import type { SessionUser } from "auth/types"

describe("SessionUser type", () => {
  test("type accepts a valid user object", () => {
    const user: SessionUser = {
      id: "usr_123",
      email: "user@example.com",
      name: "User Name",
      username: "username",
      image: null,
      role: "user",
    }
    expect(user.id).toBe("usr_123")
    expect(user.role).toBe("user")
  })
})
