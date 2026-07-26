import { OpenAPIHono } from "@hono/zod-openapi"

import type { AppContext } from "./context"

export const apiApp = new OpenAPIHono<AppContext>()
