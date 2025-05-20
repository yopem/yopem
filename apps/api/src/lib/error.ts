import { TRPCError } from "@trpc/server"

export const handleError = (error: unknown): never => {
  console.error("Error:", error)
  if (error instanceof TRPCError) {
    throw error
  } else {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An internal error occurred",
    })
  }
}
