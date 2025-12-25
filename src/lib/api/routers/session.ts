import { TRPCError } from "@trpc/server"

import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"

export const sessionRouter = createTRPCRouter({
  current: protectedProcedure.query(({ ctx }) => {
    try {
      if (!ctx.session.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No active session found",
        })
      }
      return {
        id: ctx.session.id,
        email: ctx.session.email,
        name: ctx.session.name,
        username: ctx.session.username,
        image: ctx.session.image,
        role: ctx.session.role,
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "An error occurred",
      })
    }
  }),
})
