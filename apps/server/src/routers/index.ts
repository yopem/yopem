import { assetsRouter } from "./assets"
import { categoriesRouter } from "./categories"
import { productsRouter } from "./products"
import { sessionRouter } from "./session"
import { tagsRouter } from "./tags"
import { userRouter } from "./user"

export const router = {
  ...assetsRouter,
  ...categoriesRouter,
  ...productsRouter,
  ...sessionRouter,
  ...tagsRouter,
  ...userRouter,
}
