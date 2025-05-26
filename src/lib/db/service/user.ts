import { db } from "@/lib/db"
import { accountTable, userTable, type InsertUser } from "@/lib/db/schema/user"
import { slugifyUsername } from "@/lib/utils/slug"

interface InsertUserProps extends Omit<InsertUser, "username"> {
  providerAccountId: string
}

export const insertUser = async ({
  email,
  name,
  image,
  providerAccountId,
}: InsertUserProps) => {
  const user = await db
    .insert(userTable)
    .values({
      email: email,
      name: name,
      username: await generateUniqueUsername(name!),
      image: image,
    })
    .returning()

  await db.insert(accountTable).values({
    provider: "google",
    providerAccountId: providerAccountId,
    userId: user[0].id,
  })

  return user[0]
}

export const getExistingUser = async (providerAccountId: string) => {
  return await db.query.accountTable.findFirst({
    where: (accounts, { and, eq }) =>
      and(
        eq(accounts.providerAccountId, providerAccountId),
        eq(accounts.provider, "google"),
      ),
  })
}

export const getUserByUsername = async (username: string) => {
  return await db.query.userTable.findFirst({
    where: (user, { eq }) => eq(user.username, username),
  })
}

export const searchUsers = async ({
  searchQuery,
  limit,
}: {
  searchQuery: string
  limit: number
}) => {
  return await db.query.userTable.findMany({
    where: (users, { and, or, ilike }) =>
      and(
        or(
          ilike(users.name, `%${searchQuery}%`),
          ilike(users.username, `%${searchQuery}%`),
        ),
      ),
    limit: limit,
  })
}

export const generateUniqueUsername = async (name: string): Promise<string> => {
  const username = slugifyUsername(name)
  let uniqueUsername = username
  let suffix = 1

  while (
    await db.query.userTable.findFirst({
      where: (user, { eq }) => eq(user.username, uniqueUsername),
    })
  ) {
    suffix++
    uniqueUsername = `${username}${suffix}`
  }

  return uniqueUsername
}
