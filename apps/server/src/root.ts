import { publicProcedure } from "./orpc"
import { adminRouter } from "./procedures/admin"
import { assetsRouter } from "./procedures/assets"
import { categoriesRouter } from "./procedures/categories"
import { productsRouter } from "./procedures/products"
import { sessionRouter } from "./procedures/session"
import { tagsRouter } from "./procedures/tags"
import { userRouter } from "./procedures/user"

export const appRouter = {
  health: publicProcedure.handler(() => "ok"),
  session: sessionRouter,
  admin: adminRouter,
  products: productsRouter,
  user: userRouter,
  categories: categoriesRouter,
  tags: tagsRouter,
  assets: assetsRouter,
}
