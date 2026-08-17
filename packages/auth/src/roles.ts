import * as v from "valibot"

export const ROLES = ["user", "member", "admin"] as const

export type Role = (typeof ROLES)[number]

export const roleSchema = v.picklist(ROLES)
