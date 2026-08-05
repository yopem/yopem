import type * as v from "valibot"

import type { subjects } from "./subjects"

export type SessionUser = v.InferOutput<(typeof subjects)["user"]>
