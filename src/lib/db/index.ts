import { drizzle } from "drizzle-orm/bun-sql"

import { databaseUrl } from "@/lib/utils/env"
import { chatTable } from "./schema/chat"
import { fileTable } from "./schema/file"
import { messageTable } from "./schema/message"
import { userTable } from "./schema/user"

const client = new Bun.SQL(databaseUrl)

export const db = drizzle(client, {
  schema: {
    chatTable,
    fileTable,
    messageTable,
    userTable,
  },
})
