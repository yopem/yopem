import { createClient } from "@openauthjs/openauth/client"

import { authIssuer } from "env"

export const authClient = createClient({
  clientID: "yopem",
  issuer: authIssuer ?? "",
})
