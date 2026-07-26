import type { SessionUser } from "server/auth"

import { call, ORPCError } from "@orpc/server"
import {
  os,
  requireAdminMiddleware,
  requireAuthMiddleware,
} from "server/routers/orpc"
import { describe, expect, test } from "vite-plus/test"

const anonContext = { session: null }
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

describe("orpc procedure infrastructure", () => {
  test("os is bound to a nullable session context", async () => {
    const probe = os.handler(({ context }) => context.session)
    const result = await call(probe, undefined, { context: anonContext })
    expect(result).toBeNull()
  })

  test("requireAuthMiddleware throws UNAUTHORIZED when session is null", async () => {
    const probe = os
      .use(requireAuthMiddleware)
      .handler(({ context }) => context.session)
    await expect(
      call(probe, undefined, { context: anonContext }),
    ).rejects.toThrow(ORPCError)
    await expect(
      call(probe, undefined, { context: anonContext }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })

  test("requireAuthMiddleware narrows session to non-null on success", async () => {
    const probe = os
      .use(requireAuthMiddleware)
      .handler(({ context }) => context.session)
    const result = await call(probe, undefined, { context: userContext() })
    expect(result?.id).toBe("u_1")
  })

  test("requireAdminMiddleware throws FORBIDDEN for non-admin", async () => {
    const probe = os
      .use(requireAdminMiddleware)
      .handler(({ context }) => context.session)
    await expect(
      call(probe, undefined, { context: userContext("user") }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    })
  })

  test("requireAdminMiddleware passes for admin", async () => {
    const probe = os
      .use(requireAdminMiddleware)
      .handler(({ context }) => context.session)
    const result = await call(probe, undefined, {
      context: userContext("admin"),
    })
    expect(result?.role).toBe("admin")
  })
})
