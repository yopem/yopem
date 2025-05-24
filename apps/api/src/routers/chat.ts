import { insertChat, insertChatSchema } from "@yopem/db"
import { tryCatch } from "@yopem/try-catch"

import { handleError } from "@/lib/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc"

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
