import { createTanstackQueryUtils } from "@orpc/tanstack-query"

import { serverApi } from "./server"

export const serverQueryApi = createTanstackQueryUtils(serverApi)
