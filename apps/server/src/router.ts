import { OpenAPIHono } from "@hono/zod-openapi"

import type { AppContext } from "./context"

import { adminApp } from "./routes/admin"
import {
  assetsAdminApp,
  assetsProtectedApp,
  assetsPublicApp,
} from "./routes/assets"
import {
  productsAdminApp,
  productsProtectedApp,
  productsPublicApp,
} from "./routes/products"

export const apiApp = new OpenAPIHono<AppContext>()

apiApp.route("/assets", assetsPublicApp)
apiApp.route("/assets", assetsProtectedApp)
apiApp.route("/assets", assetsAdminApp)

apiApp.route("/products", productsPublicApp)
apiApp.route("/products", productsProtectedApp)
apiApp.route("/products", productsAdminApp)

apiApp.route("/admin", adminApp)
