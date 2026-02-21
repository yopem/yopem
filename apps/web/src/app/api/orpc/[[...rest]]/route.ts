import { LoggingHandlerPlugin } from "@orpc/experimental-pino"
import { RPCHandler } from "@orpc/server/fetch"
import { appRouter } from "@repo/api"
import { createRPCContext } from "@repo/api/orpc"
import { logger } from "@repo/logger"

const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("Access-Control-Request-Method", "*")
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST")
  res.headers.set("Access-Control-Allow-Headers", "*")
}

export const OPTIONS = () => {
  const response = new Response(null, {
    status: 204,
  })
  setCorsHeaders(response)
  return response
}

const handler = new RPCHandler(appRouter, {
  interceptors: [
    async ({ next }) => {
      try {
        return await next()
      } catch (error) {
        logger.error(
          `Error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
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

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/api/orpc",
    context: await createRPCContext({
      headers: request.headers,
      request: request,
    }),
  })

  return response ?? new Response("Not found", { status: 404 })
}

export const GET = handleRequest
export const POST = handleRequest
