import { createTRPCRouter, publicProcedure } from "@/lib/trpc"
import { chatRouter } from "./chat"
import { messageRouter } from "./message"

export const appRouter = createTRPCRouter({
  healthCheck: publicProcedure.query(() => {
    return "OK"
  }),
  chat: chatRouter,
  message: messageRouter,
})

export type AppRouter = typeof appRouter
