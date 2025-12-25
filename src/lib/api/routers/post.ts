import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"
import { insertPostSchema, postTable, updatePostSchema } from "@/lib/db/schema"

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(insertPostSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [post] = await ctx.db.insert(postTable).values(input).returning()
        return post
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "An error occurred",
        })
      }
    }),

  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (!input.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Post ID is required for update",
          })
        }
        const [post] = await ctx.db
          .update(postTable)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(postTable.id, input.id))
          .returning()
        return post
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "An error occurred",
        })
      }
    }),

  all: protectedProcedure.query(async ({ ctx }) => {
    try {
      const posts = await ctx.db.query.postTable.findMany({
        where: (post, { eq }) => eq(post.userId, ctx.session.id),
        orderBy: (post, { desc }) => desc(post.createdAt),
      })
      if (posts.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No posts found for the user",
        })
      }
      return posts
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "An error occurred",
      })
    }
  }),

  byId: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      const post = await ctx.db.query.postTable.findFirst({
        where: (post, { eq }) => eq(post.id, input),
      })
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Post with ID ${input} not found`,
        })
      }
      return post
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "An error occurred",
      })
    }
  }),
})
