import { createTanstackQueryUtils } from "@orpc/tanstack-query"

import { serverApi } from "./server.ts"

export const serverQueryApi = createTanstackQueryUtils(serverApi)
