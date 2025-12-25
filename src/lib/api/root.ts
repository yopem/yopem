import { publicProcedure } from "@/lib/api/orpc"
import { sessionRouter } from "./routers/session"

export const appRouter = {
  health: publicProcedure.handler(() => "ok"),
  session: sessionRouter,
}

export type AppRouter = typeof appRouter
