"use client"

import { redirect } from "next/navigation"

import SignIn from "@/components/sign-in"
import { useSession } from "@/lib/auth-client"

export default function SignInPage() {
  // const session = await getSession({
  //   headers: await headers(),
  // })
  //
  // console.log("session", session.data)

  const { data: session } = useSession()

  if (session) {
    redirect("/")
  }

  // TODO: use server-side session check to redirect if already signed in

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <SignIn />
    </div>
  )
}
