import { createSubjects } from "@openauthjs/openauth/subject"
import * as v from "valibot"

import { roleSchema } from "./roles"

export const subjects = createSubjects({
  user: v.object({
    id: v.string(),
    email: v.string(),
    name: v.nullable(v.string()),
    username: v.string(),
    image: v.nullable(v.string()),
    role: v.optional(roleSchema, "user"),
  }),
})
