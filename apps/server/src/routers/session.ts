import { z } from "zod"

import { os, requireAuthMiddleware } from "./orpc"

const sessionOutputSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  username: z.string(),
  image: z.string().nullable(),
  role: z.enum(["user", "member", "admin"]),
})

export const sessionRouter = {
  sessionMe: os
    .route({ method: "GET", path: "/session/me" })
    .use(requireAuthMiddleware)
    .output(sessionOutputSchema)
    .handler(({ context }) => context.session),
}
