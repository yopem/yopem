import { db } from "@/db"
import { messageTable, type InsertMessage } from "@/db/schema"

export const insertMessage = async ({
  content,
  chatId,
  messageId,
  metadata,
}: InsertMessage) => {
  return await db
    .insert(messageTable)
    .values({
      content,
      chatId,
      messageId,
      role: "assistant",
      metadata,
    })
    .execute()
}
