import { publicProcedure } from "@/lib/api/orpc"
import { adminRouter } from "./routers/admin"
import { sessionRouter } from "./routers/session"
import { toolsRouter } from "./routers/tools"
import { userRouter } from "./routers/user"

export const appRouter = {
  health: publicProcedure.handler(() => "ok"),
  session: sessionRouter,
  admin: adminRouter,
  tools: toolsRouter,
  user: userRouter,
}

export type AppRouter = typeof appRouter
