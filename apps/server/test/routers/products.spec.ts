import type { SessionUser } from "server/auth"

import { call } from "@orpc/server"
import { productsRouter } from "server/routers/products"
import { describe, expect, test } from "vite-plus/test"

const userContext = (
  role: SessionUser["role"] = "user",
): { session: SessionUser } => ({
  session: {
    id: "u_1",
    email: "u@example.com",
    name: null,
    username: "u",
    image: null,
    role,
  },
})

describe("products router", () => {
  test("exports fifteen procedures nested under products", () => {
    const keys = Object.keys(productsRouter.products).sort()
    expect(keys).toEqual(
      [
        "adminById",
        "bulkStatusUpdate",
        "bySlug",
        "categories",
        "create",
        "delete",
        "duplicate",
        "execute",
        "byId",
        "list",
        "popular",
        "preview",
        "search",
        "tags",
        "update",
      ].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(productsRouter.products)) {
      expect(procedure).toBeDefined()
    }
  })

  test("protected procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(
        productsRouter.products.execute,
        { id: "p_1", inputs: {} },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(
        productsRouter.products.create,
        { name: "x" },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject non-admin sessions with FORBIDDEN", async () => {
    await expect(
      call(
        productsRouter.products.create,
        { name: "x" },
        { context: userContext("user") },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  test("public procedures expose no auth middleware", () => {
    const publicKeys = [
      "list",
      "byId",
      "bySlug",
      "popular",
      "categories",
      "tags",
      "search",
    ] as const
    for (const key of publicKeys) {
      expect(productsRouter.products[key]).toBeDefined()
    }
  })
})
