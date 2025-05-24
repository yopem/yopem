import { createTRPCRouter, protectedProcedure } from "@/lib/trpc"

export const userRouter = createTRPCRouter({
  current: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user
  }),
  session: protectedProcedure.query(({ ctx }) => {
    return ctx.session
  }),
})
export type UserRouter = typeof userRouter
