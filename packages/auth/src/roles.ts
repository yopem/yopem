import z from "zod"

export const ROLES = ["user", "member", "admin"] as const

export type Role = (typeof ROLES)[number]

export const roleSchema = z.enum(ROLES)
