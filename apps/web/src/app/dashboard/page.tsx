"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useSession } from "@/lib/auth-client"

// import { useQuery } from "@tanstack/react-query"

// import { trpc } from "@/utils/trpc"

export default function Dashboard() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // const privateData = useQuery(trpc.privateData.queryOptions())

  useEffect(() => {
    if (!session && !isPending) {
      router.push("/sign-in")
    }
  }, [session, isPending, router])

  if (isPending) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session?.user.name}</p>
      {/* <p>privateData: {privateData.data?.message}</p> */}
    </div>
  )
}
