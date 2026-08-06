import { call } from "@orpc/server"
import { describe, expect, test } from "bun:test"
import { tagsRouter } from "server/routers/tags"

describe("tags router", () => {
  test("exports six procedures nested under tags", () => {
    const keys = Object.keys(tagsRouter.tags).sort()
    expect(keys).toEqual(
      ["bulkDelete", "byId", "create", "delete", "list", "update"].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(tagsRouter.tags)) {
      expect(procedure).toBeDefined()
    }
  })

  test("admin procedures reject unauthenticated sessions with UNAUTHORIZED", () => {
    expect(
      call(
        tagsRouter.tags.create,
        { name: "x" },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject non-admin sessions with FORBIDDEN", () => {
    const nonAdminSession = {
      id: "user-1",
      email: "user@example.com",
      name: null,
      username: "user",
      image: null,
      role: "user" as const,
    }
    expect(
      call(
        tagsRouter.tags.create,
        { name: "x" },
        { context: { session: nonAdminSession } },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
