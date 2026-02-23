import { protectedProcedure } from "@repo/server/orpc"

export const sessionRouter = {
  current: protectedProcedure.handler(({ context }) => {
    return context.session
  }),
}
