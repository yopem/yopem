import { ORPCError } from "@orpc/server"
import z from "zod"

import { protectedProcedure } from "@/lib/api/orpc"
import { insertPostSchema, updatePostSchema } from "@/lib/db/schema"

const mockPosts = [
  {
    id: "example-1",
    title: "Example Post 1",
    description: "This is an example post description",
    userId: "user-1",
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
  },
  {
    id: "example-2",
    title: "Example Post 2",
    description: "Another example post with different description",
    userId: "user-1",
    createdAt: new Date("2024-01-02T10:00:00Z"),
    updatedAt: new Date("2024-01-02T10:00:00Z"),
  },
  {
    id: "example-3",
    title: "Example Post 3",
    description: "A third example post for demonstration",
    userId: "user-2",
    createdAt: new Date("2024-01-03T10:00:00Z"),
    updatedAt: new Date("2024-01-03T10:00:00Z"),
  },
]

export const exampleRouter = {
  create: protectedProcedure.input(insertPostSchema).handler(({ input }) => {
    const mockPost = {
      id: `example-${Date.now()}`,
      title: input.title,
      description: input.description ?? null,
      userId: input.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return mockPost
  }),

  update: protectedProcedure.input(updatePostSchema).handler(({ input }) => {
    if (!input.id) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Post ID is required for update",
      })
    }

    const mockPost = {
      id: input.id,
      title: input.title ?? "Updated Example Post",
      description: input.description ?? "Updated description",
      userId: input.userId ?? "example-user",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date(),
    }
    return mockPost
  }),

  all: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .handler(({ input }) => {
      const { page, limit } = input

      const sorted = mockPosts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )

      const total = sorted.length
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit
      const items = sorted.slice(offset, offset + limit)

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    }),

  infinite: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().optional(),
      }),
    )
    .handler(({ input }) => {
      const { limit, cursor = 0 } = input

      const generateMockPost = (index: number) => ({
        id: `example-${index}`,
        title: `Example Post ${index}`,
        description: `This is a dynamically generated example post #${index} for infinite scrolling demonstration`,
        userId: `user-${Math.floor((index - 1) / 10) + 1}`,
        createdAt: new Date(Date.now() - (index - 1) * 60000),
        updatedAt: new Date(Date.now() - (index - 1) * 60000),
      })

      const items = Array.from({ length: limit }, (_, i) => {
        const postIndex = cursor * limit + i + 1
        return generateMockPost(postIndex)
      })

      const nextCursor = cursor + 1

      return {
        items,
        nextCursor,
      }
    }),

  byId: protectedProcedure.input(z.string()).handler(({ input }) => {
    const post = mockPosts.find((p) => p.id === input)

    if (!post) {
      throw new ORPCError("NOT_FOUND", {
        message: `Post with ID ${input} not found`,
      })
    }

    return post
  }),
}
