import { RPCHandler } from "@orpc/server/fetch"
import { Hono } from "hono"
import { createRPCContext } from "server/orpc"
import { appRouter } from "server/router"

import type { SessionUser } from "auth/types"

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
        console.error(
          `[RPC] Error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
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
      const contentType = original.headers.get("content-type") || ""
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
