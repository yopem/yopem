import { categoriesRouter } from "./categories"
import { sessionRouter } from "./session"
import { tagsRouter } from "./tags"

export const router = {
  ...categoriesRouter,
  ...sessionRouter,
  ...tagsRouter,
}
