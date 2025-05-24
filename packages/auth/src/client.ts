import { apiUrl, googleClientId } from "@yopem/constant"
import { oneTapClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [
    oneTapClient({
      clientId: googleClientId!,
      autoSelect: true,
      cancelOnTapOutside: true,
      context: "signin",
      promptOptions: {
        baseDelay: 1000,
        maxAttempts: 5,
      },
    }),
  ],
})

export const { signIn, signOut, useSession, getSession } = authClient
