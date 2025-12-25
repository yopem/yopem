import { auth } from "@/lib/auth/session"
import Link from "./link"
import Logo from "./logo"

const Welcome = async () => {
  const session = await auth()

  return (
    <>
      <Logo className="size-10 p-3 text-center" />
      {session ? (
        <p className="mt-4 text-center">Welcome back, {session.email}!</p>
      ) : (
        <p>
          Welcome, please <Link href="/auth/login">log in</Link> to
          continue.{" "}
        </p>
      )}
    </>
  )
}

export default Welcome
