import { db } from "@/db"
import { chatTable, type InsertChat } from "@/db/schema"

export const insertChat = async ({ title, focusMode }: InsertChat) => {
  return await db
    .insert(chatTable)
    .values({
      title,
      focusMode,
    })
    .execute()
}
