import { tryCatch } from "@yopem/try-catch"

import { insertChatSchema } from "../db/schema"
import { insertChat } from "../db/service/chat"
import { handleError } from "../lib/error"
import { createTRPCRouter, protectedProcedure } from "../lib/trpc"

export const chatRouter = createTRPCRouter({
  create: protectedProcedure
    .input(insertChatSchema)
    .mutation(async ({ input }) => {
      const { data, error } = await tryCatch(insertChat(input))

      if (error) {
        handleError(error)
      }

      return data
    }),
})
export type ChatRouter = typeof chatRouter
