import { createClient } from "@openauthjs/openauth/client"
import { authIssuer } from "@repo/env/server"

export const authClient = createClient({
  clientID: "yopem",
  issuer: authIssuer,
})
