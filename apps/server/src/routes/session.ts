import type { AppContext } from "server/context"

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { requireAuth } from "server/middleware"

import { jsonOkResponse } from "./common"

export const sessionProtectedApp = new OpenAPIHono<AppContext>()

sessionProtectedApp.use("*", requireAuth)

const currentRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["session"],
  responses: {
    200: jsonOkResponse(),
  },
})

sessionProtectedApp.openapi(currentRoute, (c) => {
  return c.json(c.var.session!, 200)
})
