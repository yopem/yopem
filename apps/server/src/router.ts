import { OpenAPIHono } from "@hono/zod-openapi"

import type { AppContext } from "./context"

import { adminApp } from "./routes/admin"

export const apiApp = new OpenAPIHono<AppContext>()

apiApp.route("/admin", adminApp)
