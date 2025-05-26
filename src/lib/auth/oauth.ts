import { Google } from "arctic"

import {
  googleClientId,
  googleClientSecret,
  googleRedirectUrl,
} from "@/lib/env/server"

export const googleOAuth = new Google(
  googleClientId,
  googleClientSecret,
  googleRedirectUrl,
)
