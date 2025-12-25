import { createApi } from "@/lib/trpc/server"
import LogoutButton from "./auth/logout-button"

const User = async () => {
  const api = await createApi()

  const user = await api.session.current()

  return (
    <div>
      {user.id ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="mx-auto max-w-sm rounded-md border p-4">
            Username: {user.username}
          </div>
          <LogoutButton />
        </div>
      ) : (
        <div className="mx-auto max-w-sm rounded-md border p-4">
          Not logged in
        </div>
      )}
    </div>
  )
}

export default User
