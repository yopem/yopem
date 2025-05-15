import Link from "next/link"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

export default function UserMenu() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <Skeleton className="h-9 w-24" />
  }

  if (!session) {
    return (
      <Button variant="outline" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    )
  }

  return (
    <div>
      <Button variant="outline">{session.user.name}</Button>
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => {
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/")
              },
            },
          })
        }}
      >
        Sign Out
      </Button>
    </div>
  )
}
