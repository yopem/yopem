import { protectedProcedure } from "server/procedure"

export const sessionRouter = {
  current: protectedProcedure.handler(({ context }) => {
    return context.session
  }),
}
