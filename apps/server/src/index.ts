import { serve } from "@hono/node-server"
import { ORPCError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"

import { adminOrigin, isDev, isProd, serverPort, webOrigin } from "env"

import type { AppContext } from "./context"

import { authMiddleware } from "./auth"
import { ApiError, orpcCodeForStatus } from "./errors"
import { authCallbackRoute } from "./handlers/auth-callback"
import { router } from "./routers"

const app = new Hono<AppContext>()

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
    allowHeaders: ["Content-Type", "Authorization", "x-orpc-procedure"],
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

const orpcHandler = new RPCHandler(router, {
  interceptors: [
    async (context) => {
      try {
        return await context.next()
      } catch (error) {
        if (error instanceof ApiError) {
          throw new ORPCError(orpcCodeForStatus(error.status), {
            status: error.status,
            message: error.message,
          })
        }
        console.error(
          `oRPC error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
        )
        throw error
      }
    },
  ],
})

const proxyRequestBody = (original: Request): Request => {
  let cachedBody: ArrayBuffer | FormData | null = null
  let bodyType: "arraybuffer" | "formdata" | null = null

  const cloneBody = async () => {
    if (cachedBody === null) {
      const contentType = original.headers.get("content-type") ?? ""
      if (contentType.includes("multipart/form-data")) {
        cachedBody = await original.formData()
        bodyType = "formdata"
      } else {
        cachedBody = await original.arrayBuffer()
        bodyType = "arraybuffer"
      }
    }
    return cachedBody
  }

  return new Proxy(original, {
    get(target, prop, receiver) {
      if (prop === "json") {
        return async () => {
          const body = await cloneBody()
          if (bodyType === "formdata") {
            throw new Error("Cannot parse FormData as JSON")
          }
          const text = new TextDecoder().decode(body as ArrayBuffer)
          return JSON.parse(text)
        }
      }
      if (prop === "text") {
        return async () => {
          const body = await cloneBody()
          if (bodyType === "formdata") {
            throw new Error("Cannot parse FormData as text")
          }
          return new TextDecoder().decode(body as ArrayBuffer)
        }
      }
      if (prop === "arrayBuffer") {
        return async () => {
          const body = await cloneBody()
          if (bodyType === "formdata") {
            throw new Error("Cannot convert FormData to ArrayBuffer")
          }
          return (body as ArrayBuffer).slice(0)
        }
      }
      if (prop === "formData") {
        return async () => {
          const body = await cloneBody()
          if (bodyType === "formdata") {
            return body as FormData
          }
          throw new Error("Body is not FormData")
        }
      }
      if (prop === "body") {
        return target.body
      }
      if (prop === "bodyUsed") {
        return false
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}

app.use("/rpc/*", async (c, next) => {
  const request = proxyRequestBody(c.req.raw)

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
