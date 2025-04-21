import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"

import { createId } from "@/lib/utils/id"

export const USER_ROLE = ["user", "member", "admin"] as const

export const userRole = z.enum(USER_ROLE)

export const userRoleEnum = pgEnum("user_role", USER_ROLE)

export const userTable = pgTable("users", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email"),
  name: text("name"),
  username: text("username").notNull().unique(),
  image: text("image"),
  phoneNumber: text("phone_number"),
  about: text("about"),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const accountTable = pgTable("accounts", {
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id")
    .notNull()
    .unique()
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const sessionTable = pgTable("sessions", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
})

export const insertUserSchema = createInsertSchema(userTable)
export const updateUserSchema = createUpdateSchema(userTable)

export type SelectUser = typeof userTable.$inferSelect
export type SelectSession = typeof sessionTable.$inferSelect

export type UserRole = z.infer<typeof userRole>
