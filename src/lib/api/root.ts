import { publicProcedure } from "@/lib/api/orpc"
import { exampleRouter } from "./routers/example"
import { postRouter } from "./routers/post"
import { sessionRouter } from "./routers/session"

export const appRouter = {
  health: publicProcedure.handler(() => "ok"),
  example: exampleRouter,
  post: postRouter,
  session: sessionRouter,
}

export type AppRouter = typeof appRouter
