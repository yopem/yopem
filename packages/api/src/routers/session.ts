import { protectedProcedure } from "../orpc"

export const sessionRouter = {
  current: protectedProcedure.handler(({ context }) => {
    return context.session
  }),
}
