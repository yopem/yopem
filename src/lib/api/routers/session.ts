import { protectedProcedure } from "@/lib/api/orpc"

export const sessionRouter = {
  current: protectedProcedure.handler(({ context }) => {
    return context.session
  }),
}
