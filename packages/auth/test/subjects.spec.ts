import * as v from "valibot"
import { describe, expect, test } from "vite-plus/test"

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
    const result = v.safeParse(subjects.user, user)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.id).toBe("usr_123")
      expect(result.output.role).toBe("user")
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
    const result = v.safeParse(subjects.user, user)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.role).toBe("user")
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
    const result = v.safeParse(subjects.user, user)
    expect(result.success).toBe(false)
  })

  test("user subject requires id, email, and username", () => {
    const result = v.safeParse(subjects.user, { name: null, image: null })
    expect(result.success).toBe(false)
  })
})
