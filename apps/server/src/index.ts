import { serve } from "@hono/node-server"
import { OpenAPIHono } from "@hono/zod-openapi"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { ORPCError, onError } from "@orpc/server"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"

import { adminOrigin, isDev, isProd, serverPort, webOrigin } from "env"

import type { AppContext } from "./context"

import { authMiddleware } from "./auth"
import { ApiError } from "./errors"
import { authCallbackRoute } from "./handlers/auth-callback"
import { apiApp } from "./router"
import { router } from "./routers"

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

const orpcHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      if (error instanceof ApiError) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          status: error.status,
          message: error.message,
        })
      }
      console.error(
        `oRPC error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      )
    }),
  ],
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: { title: "Yopem RPC API", version: "1.0.0" },
      },
      docsPath: "/doc",
      specPath: "/spec.json",
    }),
  ],
})

const BODY_PARSER_METHODS = [
  "arrayBuffer",
  "blob",
  "formData",
  "json",
  "text",
] as const

type BodyParserMethod = (typeof BODY_PARSER_METHODS)[number]

app.use("/rpc/*", async (c, next) => {
  const request = new Proxy(c.req.raw, {
    get(target, prop) {
      if (
        typeof prop === "string" &&
        (BODY_PARSER_METHODS as readonly string[]).includes(prop)
      ) {
        const method = prop as BodyParserMethod
        return () => c.req[method]()
      }
      return Reflect.get(target, prop, target)
    },
  })

  const { matched, response } = await orpcHandler.handle(request, {
    prefix: "/rpc",
    context: { session: c.get("session") },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }
  await next()
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
