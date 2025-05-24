import { db } from "@/connection"
import { messageTable, type InsertMessage } from "@/schema"

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
