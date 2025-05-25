import { drizzle } from "drizzle-orm/node-postgres"

import { databaseUrl } from "@/lib/utils/env"
import { chatTable } from "./schema/chat"
import { fileTable } from "./schema/file"
import { messageTable } from "./schema/message"
import { userTable } from "./schema/user"

export const db = drizzle(databaseUrl, {
  schema: {
    chatTable,
    fileTable,
    messageTable,
    userTable,
  },
})
