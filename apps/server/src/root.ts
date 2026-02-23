import { publicProcedure } from "./orpc"
import { adminRouter } from "./procedures/admin"
import { assetsRouter } from "./procedures/assets"
import { categoriesRouter } from "./procedures/categories"
import { sessionRouter } from "./procedures/session"
import { tagsRouter } from "./procedures/tags"
import { toolsRouter } from "./procedures/tools"
import { userRouter } from "./procedures/user"

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
