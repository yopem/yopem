import { serve } from "@hono/node-server"
import { logger as pinoLogger } from "@repo/logger"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"

import { authMiddleware } from "./auth"
import { authCallbackRoute } from "./routes/auth-callback"
import { checkoutRoute } from "./routes/checkout"
import { portalRoute } from "./routes/portal"
import { rpcRoute } from "./routes/rpc"
import { webhooksRoute } from "./routes/webhooks"

const app = new Hono()

const appEnv = process.env["APP_ENV"] ?? "development"
const port = Number(process.env["SERVER_PORT"]) || 4000

const allowedOrigins =
  appEnv === "development"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : [
        process.env["WEB_ORIGIN"] ?? "",
        process.env["ADMIN_ORIGIN"] ?? "",
      ].filter(Boolean)

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use("*", async (c, next) => {
  const start = Date.now()
  await next()
  const elapsed = Date.now() - start
  pinoLogger.info(`${c.req.method} ${c.req.path} ${c.res.status} ${elapsed}ms`)
})

app.use("*", authMiddleware)

app.get("/health", (c) => {
  return c.json({ status: "ok" })
})

app.route("/auth", authCallbackRoute)
app.route("/rpc", rpcRoute)
app.route("/checkout", checkoutRoute)
app.route("/portal", portalRoute)
app.route("/webhooks", webhooksRoute)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    pinoLogger.error(`HTTPException: ${err.status} ${err.message}`)
    return c.json({ error: err.message }, err.status)
  }

  pinoLogger.error(
    `Unhandled error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
  )
  return c.json({ error: "Internal Server Error" }, 500)
})

serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    pinoLogger.info(`Hono server listening on port ${port}`)
  },
)

export default app
