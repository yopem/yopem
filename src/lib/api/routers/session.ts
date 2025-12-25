import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"

export const sessionRouter = createTRPCRouter({
  current: protectedProcedure.query(({ ctx }) => {
    return ctx.session
  }),
})
