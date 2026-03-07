import { createTanstackQueryUtils } from "@orpc/tanstack-query"

import { clientApi } from "./client.ts"

export const queryApi = createTanstackQueryUtils(clientApi)
