import { call } from "@orpc/server"
import { describe, expect, test } from "bun:test"
import { categoriesRouter } from "server/routers/categories"

describe("categories router", () => {
  test("exports seven procedures nested under categories", () => {
    const keys = Object.keys(categoriesRouter.categories).sort()
    expect(keys).toEqual(
      [
        "bulkDelete",
        "bulkStatusUpdate",
        "byId",
        "create",
        "delete",
        "list",
        "update",
      ].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(categoriesRouter.categories)) {
      expect(procedure).toBeDefined()
    }
  })

  test("admin procedures reject unauthenticated sessions with UNAUTHORIZED", () => {
    expect(
      call(
        categoriesRouter.categories.create,
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
        categoriesRouter.categories.create,
        { name: "x" },
        { context: { session: nonAdminSession } },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
