import { OpenAPIHono } from "@hono/zod-openapi"

import type { AppContext } from "./context"

import { adminApp } from "./routes/admin"
import {
  assetsAdminApp,
  assetsProtectedApp,
  assetsPublicApp,
} from "./routes/assets"
import { categoriesAdminApp, categoriesPublicApp } from "./routes/categories"
import {
  productsAdminApp,
  productsProtectedApp,
  productsPublicApp,
} from "./routes/products"
import { sessionProtectedApp } from "./routes/session"
import { tagsAdminApp, tagsPublicApp } from "./routes/tags"
import { userAdminApp, userProtectedApp } from "./routes/user"

export const apiApp = new OpenAPIHono<AppContext>()

apiApp.route("/categories", categoriesPublicApp)
apiApp.route("/categories", categoriesAdminApp)

apiApp.route("/tags", tagsPublicApp)
apiApp.route("/tags", tagsAdminApp)

apiApp.route("/assets", assetsPublicApp)
apiApp.route("/assets", assetsProtectedApp)
apiApp.route("/assets", assetsAdminApp)

apiApp.route("/products", productsPublicApp)
apiApp.route("/products", productsProtectedApp)
apiApp.route("/products", productsAdminApp)

apiApp.route("/session", sessionProtectedApp)

apiApp.route("/user", userProtectedApp)
apiApp.route("/user/api-keys", userAdminApp)

apiApp.route("/admin", adminApp)
