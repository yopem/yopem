import type { RouterClient } from "@orpc/server"
import type { router } from "server/routers"

import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"

export type RPCClient = RouterClient<typeof router>

export const createRPCClient = (baseUrl: string): RPCClient =>
  createORPCClient<RouterClient<typeof router>>(new RPCLink({ url: baseUrl }))
