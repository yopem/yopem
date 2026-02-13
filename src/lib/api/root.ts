import { publicProcedure } from "@/lib/api/orpc"

import { adminRouter } from "./routers/admin"
import { assetsRouter } from "./routers/assets"
import { categoriesRouter } from "./routers/categories"
import { sessionRouter } from "./routers/session"
import { tagsRouter } from "./routers/tags"
import { toolsRouter } from "./routers/tools"
import { userRouter } from "./routers/user"

export const appRouter = {
  health: publicProcedure.handler(() => "ok"),
  session: sessionRouter,
  admin: adminRouter,
  tools: toolsRouter,
  user: userRouter,
  categories: categoriesRouter,
  tags: tagsRouter,
  assets: assetsRouter,
}

export type AppRouter = typeof appRouter
