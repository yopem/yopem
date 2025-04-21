import { TRPCError } from "@trpc/server"
import { tryCatch } from "@yopem/try-catch"
import { z } from "zod"

import { createTRPCRouter, publicProcedure } from "@/lib/api/trpc"
import { getUserByUsername, searchUsers } from "@/lib/db/service/user"

export const userRouter = createTRPCRouter({
  byUsername: publicProcedure.input(z.string()).query(async ({ input }) => {
    const { data, error } = await tryCatch(getUserByUsername(input))
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching user",
      })
    }
    return data
  }),

  search: publicProcedure
    .input(z.object({ searchQuery: z.string(), limit: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await tryCatch(searchUsers(input))
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error fetching users",
        })
      }
      return data
    }),
})
