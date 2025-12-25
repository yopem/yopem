import { auth } from "@/lib/auth/session"
import LogoutButton from "./auth/logout-button"
import Link from "./link"
import Logo from "./logo"

const Welcome = async () => {
  const session = await auth()

  return (
    <>
      <Logo className="size-40 p-3 text-center" />
      {session ? (
        <div className="flex flex-col items-center gap-4">
          <p className="mt-4 text-center">Welcome back, {session.email}!</p>
          <LogoutButton />
        </div>
      ) : (
        <p>
          Welcome, please <Link href="/auth/login">log in</Link> to continue.
        </p>
      )}
    </>
  )
}

export default Welcome
