"use client"

import { useQuery } from "@tanstack/react-query"

import { useTRPC } from "@/lib/trpc/client"

const User = () => {
  const trpc = useTRPC()

  const { data: user } = useQuery(trpc.session.current.queryOptions())

  return (
    <div>
      <div className="mx-auto max-w-sm rounded-md border p-4">
        {user?.email}
      </div>
    </div>
  )
}

export default User
