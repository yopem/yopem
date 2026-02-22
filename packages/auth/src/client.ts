import { createClient } from "@openauthjs/openauth/client"

export const authClient = createClient({
  clientID: "yopem",
  issuer: process.env["AUTH_ISSUER"] ?? "",
})
