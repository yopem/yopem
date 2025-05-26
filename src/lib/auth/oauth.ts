import { Google } from "arctic"

import {
  googleClientId,
  googleClientSecret,
  googleRedirectUrl,
} from "@/lib/utils/env/server"

export const googleOAuth = new Google(
  googleClientId || "",
  googleClientSecret || "",
  googleRedirectUrl || "http://localhost:3000/login/google/callback",
)
