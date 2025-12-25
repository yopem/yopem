"use client"

import { useQuery } from "@tanstack/react-query"

import { useTRPC } from "@/lib/trpc/client"
import LogoutButton from "./auth/logout-button"

const User = () => {
  const trpc = useTRPC()

  const { data: user } = useQuery(trpc.session.current.queryOptions())

  return (
    <div>
      {user ? (
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
