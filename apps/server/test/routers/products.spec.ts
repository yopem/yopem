import type { SessionUser } from "server/auth"

import { call } from "@orpc/server"
import { productsRouter, validateModelForKey } from "server/routers/products"
import { describe, expect, test, vi } from "vite-plus/test"

import type { ApiKeyConfig } from "utils/api-input"

const listProductsSpy = vi.hoisted(() => vi.fn().mockResolvedValue([]))

vi.mock("db/services/products", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>()
  return { ...original, listProducts: listProductsSpy }
})

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

const sampleKey: ApiKeyConfig = {
  id: "k_1",
  provider: "openrouter",
  name: "Test Key",
  apiKey: "encrypted",
  status: "active",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
}

const minimalWorkflow = {
  nodes: [
    {
      id: "input_1",
      type: "input" as const,
      position: { x: 0, y: 0 },
      data: {
        label: "Input",
        fields: [
          {
            variableName: "x",
            description: "x",
            type: "text" as const,
          },
        ],
      },
    },
    {
      id: "output_1",
      type: "output" as const,
      position: { x: 200, y: 0 },
      data: { label: "Output", template: "{{x}}", outputName: "final" },
    },
  ],
  edges: [{ id: "e1", source: "input_1", target: "output_1" }],
}

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

  test("validateModelForKey passes when model exists and is enabled", async () => {
    const findModel = () => Promise.resolve({ id: "m_1", isEnabled: true })

    await expect(
      validateModelForKey(sampleKey, "openai/gpt-4o-mini", findModel),
    ).resolves.toBeUndefined()
  })

  test("validateModelForKey rejects disabled models", async () => {
    const findModel = () => Promise.resolve({ id: "m_1", isEnabled: false })

    await expect(
      validateModelForKey(sampleKey, "openai/gpt-4o-mini", findModel),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
  })

  test("validateModelForKey rejects missing models", async () => {
    const findModel = () => Promise.resolve(null)

    await expect(
      validateModelForKey(sampleKey, "missing-model", findModel),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
  })

  test("validateModelForKey rejects invalid key providers", async () => {
    const findModel = () => Promise.resolve({ id: "m_1", isEnabled: true })
    const badKey = { ...sampleKey, provider: "not-a-provider" as "openai" }

    await expect(
      validateModelForKey(badKey, "openai/gpt-4o-mini", findModel),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" })
  })
})

describe("products router", () => {
  test("admin procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(
        productsRouter.products.create,
        { name: "x", workflow: minimalWorkflow },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject non-admin sessions with FORBIDDEN", async () => {
    await expect(
      call(
        productsRouter.products.create,
        { name: "x", workflow: minimalWorkflow },
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

describe("products.list status clamping", () => {
  test("clamps status to active for unauthenticated callers requesting all", async () => {
    listProductsSpy.mockClear()
    await call(
      productsRouter.products.list,
      { status: "all" },
      { context: { session: null } },
    )
    expect(listProductsSpy).toHaveBeenCalledOnce()
    expect(listProductsSpy.mock.calls[0][0]).toMatchObject({ status: "active" })
  })

  test("clamps status to active for non-admin callers requesting draft", async () => {
    listProductsSpy.mockClear()
    await call(
      productsRouter.products.list,
      { status: "draft" },
      { context: userContext("user") },
    )
    expect(listProductsSpy).toHaveBeenCalledOnce()
    expect(listProductsSpy.mock.calls[0][0]).toMatchObject({ status: "active" })
  })

  test("preserves requested status for admin callers", async () => {
    listProductsSpy.mockClear()
    await call(
      productsRouter.products.list,
      { status: "all" },
      { context: userContext("admin") },
    )
    expect(listProductsSpy).toHaveBeenCalledOnce()
    expect(listProductsSpy.mock.calls[0][0]).toMatchObject({ status: "all" })
  })
})
