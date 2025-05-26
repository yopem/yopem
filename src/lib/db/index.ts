import { drizzle } from "drizzle-orm/node-postgres"

import { databaseUrl } from "@/lib/utils/env/server"
import { chatTable } from "./schema/chat"
import { fileTable } from "./schema/file"
import { messageTable } from "./schema/message"
import { accountTable, sessionTable, userTable } from "./schema/user"

export const db = drizzle(databaseUrl, {
  schema: {
    accountTable,
    chatTable,
    fileTable,
    messageTable,
    sessionTable,
    userTable,
  },
})
