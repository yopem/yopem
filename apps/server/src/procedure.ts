import type { z } from "zod"

import { HTTPException } from "hono/http-exception"

import type { SessionUser } from "auth/types"
import type { RedisCache } from "cache/client"

export interface ProcedureContext {
  session: SessionUser
  redis: RedisCache
}

type Auth = "public" | "protected" | "admin"

type ProcedureHandler<TInput> = (args: {
  context: ProcedureContext
  input: TInput
}) => unknown

export interface Procedure<TInput = unknown> {
  auth: Auth
  inputSchema?: z.ZodTypeAny
  handler: ProcedureHandler<TInput>
}

const createProcedure = (auth: Auth) => ({
  input<T extends z.ZodTypeAny>(schema: T) {
    return {
      handler: (
        handler: ProcedureHandler<z.infer<T>>,
      ): Procedure<z.infer<T>> => ({
        auth,
        inputSchema: schema,
        handler,
      }),
    }
  },
  handler: (handler: ProcedureHandler<unknown>): Procedure => ({
    auth,
    handler,
  }),
})

export const publicProcedure = createProcedure("public")
export const protectedProcedure = createProcedure("protected")
export const adminProcedure = createProcedure("admin")

const statusMap = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

export class ORPCError extends HTTPException {
  constructor(
    code: keyof typeof statusMap,
    options: { message: string; cause?: unknown },
  ) {
    super(statusMap[code], {
      message: options.message,
      cause: options.cause,
    })
  }
}
