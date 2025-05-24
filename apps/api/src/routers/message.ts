import { insertMessage, insertMessageSchema } from "@yopem/db"
import { tryCatch } from "@yopem/try-catch"

import { handleError } from "@/lib/error"
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc"

export const messageRouter = createTRPCRouter({
  create: protectedProcedure
    .input(insertMessageSchema)
    .mutation(async ({ input }) => {
      const { data, error } = await tryCatch(insertMessage(input))

      if (error) {
        handleError(error)
      }

      return data
    }),
})
export type MessageRouter = typeof messageRouter
