import type { CreateRouterUtilsOptions } from "@orpc/tanstack-query"

import { createRouterUtils } from "@orpc/tanstack-query"

import type { RPCClient } from "./client"

export const createORPCUtils = (
  client: RPCClient,
  options?: CreateRouterUtilsOptions<RPCClient>,
) => createRouterUtils(client, options)

export type ORPCUtils = ReturnType<typeof createORPCUtils>
