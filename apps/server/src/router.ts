import { OpenAPIHono } from "@hono/zod-openapi"

import type { AppContext } from "./context"

import { adminApp } from "./routes/admin"
import {
  productsAdminApp,
  productsProtectedApp,
  productsPublicApp,
} from "./routes/products"

export const apiApp = new OpenAPIHono<AppContext>()

apiApp.route("/products", productsPublicApp)
apiApp.route("/products", productsProtectedApp)
apiApp.route("/products", productsAdminApp)

apiApp.route("/admin", adminApp)
