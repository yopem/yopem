import { auth } from "@yopem/auth"
import type { Context as HonoContext } from "hono"

export interface CreateContextOptions {
  context: HonoContext
}

export async function createTRPCContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  })

  return {
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
