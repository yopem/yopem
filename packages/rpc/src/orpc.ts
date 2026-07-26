import { createRouterUtils } from "@orpc/tanstack-query"

import type { RPCClient } from "./client"

export const createORPCUtils = (client: RPCClient) => createRouterUtils(client)

export type ORPCUtils = ReturnType<typeof createORPCUtils>
