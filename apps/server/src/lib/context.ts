import type { SessionUser } from "auth/types"

export interface AppContext {
  Variables: {
    session: SessionUser | null
  }
}
