"use client"

import { redirect } from "next/navigation"
import { useSession } from "@yopem/auth/client"

import SignIn from "@/components/sign-in"

export default function SignInPage() {
  const { data: session } = useSession()

  if (session) {
    redirect("/")
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <SignIn />
    </div>
  )
}
