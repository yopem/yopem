import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "@yopem/auth/client"
import { siteUrl } from "@yopem/constant"

import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

export default function UserMenu() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <Skeleton className="h-9 w-24" />
  }

  if (!session) {
    return (
      <Button variant="outline" asChild>
        <Link href="/sign-in">Sign In</Link>
      </Button>
    )
  }

  return (
    <div>
      <Button variant="outline">{session.user.name}</Button>
      <Button
        variant="danger"
        className="w-full"
        onClick={() => {
          void signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push(siteUrl!)
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
