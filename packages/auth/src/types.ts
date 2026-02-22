import type z from "zod"

import type { subjects } from "./subjects"

export type SessionUser = z.infer<(typeof subjects)["user"]>
