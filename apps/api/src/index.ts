import "dotenv/config"

import { serve } from "@hono/node-server"
import { trpcServer } from "@hono/trpc-server"
import { auth } from "@yopem/auth"
import { siteUrl } from "@yopem/constant"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

import { createTRPCContext } from "./lib/context"
import { appRouter } from "./routers/index"

const app = new Hono()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: siteUrl ?? "",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
)

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createTRPCContext({ context })
    },
  }),
)

app.get("/", (c) => {
  return c.text("Hello, World!")
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${String(info.port)}`)
  },
)

export * from "./lib/context"
export * from "./lib/trpc"
export * from "./routers"
