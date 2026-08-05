import * as v from "valibot"

import { roleSchema } from "auth/roles"

import { os, requireAuthMiddleware } from "./orpc"

const sessionOutputSchema = v.object({
  id: v.string(),
  email: v.string(),
  name: v.nullable(v.string()),
  username: v.string(),
  image: v.nullable(v.string()),
  role: roleSchema,
})

export const sessionRouter = {
  session: {
    me: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .output(sessionOutputSchema)
      .handler(({ context }) => context.session),
  },
}
