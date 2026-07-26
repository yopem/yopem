import { categoriesRouter } from "./categories"
import { tagsRouter } from "./tags"

export const router = {
  ...categoriesRouter,
  ...tagsRouter,
}
