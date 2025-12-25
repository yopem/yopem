"use client"

import { useQuery } from "@tanstack/react-query"

import { useTRPC } from "@/lib/trpc/client"
import { HydrateClient, prefetch } from "@/lib/trpc/server"
import LogoutButton from "./auth/logout-button"

const User = () => {
  const trpc = useTRPC()
  void prefetch(trpc.session.current.queryOptions())

  const { data: user } = useQuery(trpc.session.current.queryOptions())

  return (
    <HydrateClient>
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
    </HydrateClient>
  )
}

export default User
