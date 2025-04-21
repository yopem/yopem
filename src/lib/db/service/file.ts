import { count } from "drizzle-orm"

import { db } from "@/lib/db"
import { fileTable, type FileCategory } from "@/lib/db/schema/file"

export const getFilesByCategory = async (category: FileCategory) => {
  return await db.query.fileTable.findMany({
    where: (files, { eq }) => eq(files.category, category),
    limit: 1000,
  })
}

export const getFileSitemap = async ({
  page,
  perPage,
}: {
  page: number
  perPage: number
}) => {
  return await db.query.fileTable.findMany({
    columns: {
      url: true,
      updatedAt: true,
    },
    limit: perPage,
    offset: (page - 1) * perPage,
    orderBy: (files, { desc }) => [desc(files.id)],
  })
}

export const getFilesCount = async () => {
  const data = await db.select({ count: count() }).from(fileTable)

  return data[0].count
}

export const searchFiles = async ({
  searchQuery,
  limit,
}: {
  searchQuery: string
  limit: number
}) => {
  return await db.query.fileTable.findMany({
    where: (files, { ilike }) => ilike(files.name, `%${searchQuery}%`),
    limit: limit,
  })
}

export const searchFilesByCategory = async ({
  searchQuery,
  category,
  limit,
}: {
  searchQuery: string
  category: FileCategory
  limit: number
}) => {
  return await db.query.fileTable.findMany({
    where: (files, { and, ilike, eq }) =>
      and(eq(files.category, category), ilike(files.name, `%${searchQuery}%`)),
    limit: limit,
  })
}
