import { LoggingHandlerPlugin } from "@orpc/experimental-pino"
import { RPCHandler } from "@orpc/server/fetch"
import type { SessionUser } from "@repo/auth/types"
import { logger } from "@repo/logger"
import { createRPCContext } from "@repo/server/orpc"
import { appRouter } from "@repo/server/router"
import { Hono } from "hono"

interface Env {
  Variables: {
    session: SessionUser | null
  }
}

const handler = new RPCHandler(appRouter, {
  interceptors: [
    async ({ next }) => {
      try {
        return await next()
      } catch (error) {
        logger.error(
          `[RPC] Error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
        )
        throw error
      }
    },
  ],
  plugins: [
    new LoggingHandlerPlugin({
      logger,
      logRequestResponse: true,
      logRequestAbort: true,
    }),
  ],
})

const proxyRequestBody = (original: Request): Request => {
  let cachedArrayBuffer: ArrayBuffer | null = null

  const cloneBody = async () => {
    if (cachedArrayBuffer === null) {
      cachedArrayBuffer = await original.arrayBuffer()
    }
    return cachedArrayBuffer
  }

  return new Proxy(original, {
    get(target, prop, receiver) {
      if (prop === "json") {
        return async () => {
          const buf = await cloneBody()
          const text = new TextDecoder().decode(buf)
          return JSON.parse(text)
        }
      }
      if (prop === "text") {
        return async () => {
          const buf = await cloneBody()
          return new TextDecoder().decode(buf)
        }
      }
      if (prop === "arrayBuffer") {
        return async () => {
          const buf = await cloneBody()
          return buf.slice(0)
        }
      }
      if (prop === "formData") {
        return async () => {
          const buf = await cloneBody()
          const blob = new Blob([buf], {
            type: target.headers.get("content-type") ?? "",
          })
          const response = new Response(blob)
          return response.formData()
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

const rpcRoute = new Hono<Env>()

rpcRoute.all("/*", async (c) => {
  const session = c.get("session")
  const proxiedRequest = proxyRequestBody(c.req.raw)

  const context = await createRPCContext({
    headers: c.req.raw.headers,
    session,
  })

  const { response } = await handler.handle(proxiedRequest, {
    prefix: "/rpc",
    context,
  })

  return response ?? c.json({ error: "Not found" }, 404)
})

export { rpcRoute }
