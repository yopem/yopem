import { describe, expect, test } from "vitest"

import { subjects } from "auth/subjects"

describe("subjects", () => {
  test("user subject validates a valid user", () => {
    const user = {
      id: "usr_123",
      email: "user@example.com",
      name: "User Name",
      username: "username",
      image: null,
      role: "user",
    }
    const result = subjects.user.safeParse(user)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe("usr_123")
      expect(result.data.role).toBe("user")
    }
  })

  test("user subject defaults role to user", () => {
    const user = {
      id: "usr_123",
      email: "user@example.com",
      name: null,
      username: "username",
      image: null,
    }
    const result = subjects.user.safeParse(user)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe("user")
    }
  })

  test("user subject rejects invalid role", () => {
    const user = {
      id: "usr_123",
      email: "user@example.com",
      name: null,
      username: "username",
      image: null,
      role: "superadmin",
    }
    const result = subjects.user.safeParse(user)
    expect(result.success).toBe(false)
  })

  test("user subject requires id, email, and username", () => {
    const result = subjects.user.safeParse({ name: null, image: null })
    expect(result.success).toBe(false)
  })
})
