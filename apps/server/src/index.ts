import { serve } from "@hono/node-server"
import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"

import { adminOrigin, webOrigin, serverPort, isDev, isProd } from "env"

import type { AppContext } from "./context"

import { authMiddleware } from "./auth"
import { authCallbackRoute } from "./handlers/auth-callback"
import { apiApp } from "./router"

const app = new OpenAPIHono<AppContext>()

const port = serverPort

const allowedOrigins = isDev
  ? [
      webOrigin ?? "http://localhost:3000",
      adminOrigin ?? "http://localhost:3001",
    ]
  : [webOrigin ?? "", adminOrigin ?? ""].filter(Boolean)

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Disposition"],
  }),
)

app.use("*", async (c, next) => {
  const start = Date.now()
  await next()
  const elapsed = Date.now() - start
  console.info(`${c.req.method} ${c.req.path} ${c.res.status} ${elapsed}ms`)
})

app.use("*", authMiddleware)

app.get("/health", (c) => {
  return c.json({ status: "ok" })
})

app.route("/auth", authCallbackRoute)
app.route("/api", apiApp)

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "Yopem API",
    version: "1.0.0",
  },
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(`HTTPException: ${err.status} ${err.message}`)
    return c.json({ error: err.message }, err.status)
  }

  console.error(
    `Unhandled error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
  )
  return c.json({ error: "Internal Server Error" }, 500)
})

export default app

if (isProd) {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    () => {
      console.info(`Hono server listening on port ${port}`)
    },
  )
}
