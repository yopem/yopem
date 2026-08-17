import { adminRouter } from "./admin"
import { assetsRouter } from "./assets"
import { categoriesRouter } from "./categories"
import { productsRouter } from "./products"
import { sessionRouter } from "./session"
import { slugsRouter } from "./slugs"
import { tagsRouter } from "./tags"
import { userRouter } from "./user"

export const router = {
  ...adminRouter,
  ...assetsRouter,
  ...categoriesRouter,
  ...productsRouter,
  ...sessionRouter,
  ...slugsRouter,
  ...tagsRouter,
  ...userRouter,
}
