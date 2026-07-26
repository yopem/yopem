import { categoriesRouter } from "./categories"
import { sessionRouter } from "./session"
import { tagsRouter } from "./tags"
import { userRouter } from "./user"

export const router = {
  ...categoriesRouter,
  ...sessionRouter,
  ...tagsRouter,
  ...userRouter,
}
