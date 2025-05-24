import { createTRPCRouter, publicProcedure } from "@/lib/trpc"
import { chatRouter } from "./chat"
import { messageRouter } from "./message"
import { userRouter } from "./user"

export const appRouter = createTRPCRouter({
  healthCheck: publicProcedure.query(() => {
    return "OK"
  }),
  chat: chatRouter,
  message: messageRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
