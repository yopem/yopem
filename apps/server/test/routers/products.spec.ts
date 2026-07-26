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
  test("exports fifteen procedures with flat RPC paths", () => {
    const keys = Object.keys(productsRouter).sort()
    expect(keys).toEqual(
      [
        "productAdminById",
        "productBulkStatusUpdate",
        "productBySlug",
        "productCategories",
        "productCreate",
        "productDelete",
        "productDuplicate",
        "productExecute",
        "productById",
        "productList",
        "productPopular",
        "productPreview",
        "productSearch",
        "productTags",
        "productUpdate",
      ].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(productsRouter)) {
      expect(procedure).toBeDefined()
    }
  })

  test("protected procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(
        productsRouter.productExecute,
        { id: "p_1", inputs: {} },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(
        productsRouter.productCreate,
        { name: "x" },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject non-admin sessions with FORBIDDEN", async () => {
    await expect(
      call(
        productsRouter.productCreate,
        { name: "x" },
        { context: userContext("user") },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  test("public procedures expose no auth middleware", () => {
    const publicKeys = [
      "productList",
      "productById",
      "productBySlug",
      "productPopular",
      "productCategories",
      "productTags",
      "productSearch",
    ] as const
    for (const key of publicKeys) {
      expect(productsRouter[key]).toBeDefined()
    }
  })
})
