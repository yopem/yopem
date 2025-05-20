import { db } from ".."
import { chatTable, type InsertChat } from "../schema"

export const insertChat = async ({ title, focusMode }: InsertChat) => {
  return await db
    .insert(chatTable)
    .values({
      title,
      focusMode,
    })
    .execute()
}
