"use client"

import { redirect } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "@yopem/auth/client"

import { trpc } from "@/lib/trpc"

export default function Dashboard() {
  const { data: session, isPending } = useSession()

  const userData = useQuery(trpc.user.current.queryOptions())

  if (!session) {
    redirect("/sign-in")
  }

  if (isPending) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session.user.name}</p>
      <p>User Data: {userData.data?.email}</p>
    </div>
  )
}
