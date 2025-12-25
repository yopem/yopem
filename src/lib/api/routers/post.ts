import { ORPCError } from "@orpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

import { protectedProcedure } from "@/lib/api/orpc"
import { insertPostSchema, postTable, updatePostSchema } from "@/lib/db/schema"

export const postRouter = {
  create: protectedProcedure
    .input(insertPostSchema)
    .handler(async ({ context, input }) => {
      try {
        const [post] = await context.db
          .insert(postTable)
          .values(input)
          .returning()
        return post
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: error instanceof Error ? error.message : "An error occurred",
        })
      }
    }),

  update: protectedProcedure
    .input(updatePostSchema)
    .handler(async ({ context, input }) => {
      try {
        if (!input.id) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Post ID is required for update",
          })
        }
        const [post] = await context.db
          .update(postTable)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(postTable.id, input.id))
          .returning()
        return post
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: error instanceof Error ? error.message : "An error occurred",
        })
      }
    }),

  all: protectedProcedure.handler(async ({ context }) => {
    try {
      const posts = await context.db.query.postTable.findMany({
        where: (post, { eq }) => eq(post.userId, context.session.id),
        orderBy: (post, { desc }) => desc(post.createdAt),
      })
      if (posts.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "No posts found for the user",
        })
      }
      return posts
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: error instanceof Error ? error.message : "An error occurred",
      })
    }
  }),

  byId: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      try {
        const post = await context.db.query.postTable.findFirst({
          where: (post, { eq }) => eq(post.id, input),
        })
        if (!post) {
          throw new ORPCError("NOT_FOUND", {
            message: `Post with ID ${input} not found`,
          })
        }
        return post
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: error instanceof Error ? error.message : "An error occurred",
        })
      }
    }),
}
