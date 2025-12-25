import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "@/lib/api/trpc"
import { postRouter } from "./routers/post"
import { sessionRouter } from "./routers/session"

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => "ok"),

  post: postRouter,
  session: sessionRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
