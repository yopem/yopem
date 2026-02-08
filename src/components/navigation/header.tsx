import Link from "@/components/link"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { login } from "@/lib/auth/login"
import { auth } from "@/lib/auth/session"

const Header = async () => {
  const session = await auth()

  return (
    <div className="bg-card/80 supports-backdrop-filter:bg-card/60 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4">
        <div className="mr-8 flex items-center gap-2">
          <div className="bg-card text-card-foreground flex size-6 items-center justify-center overflow-hidden rounded-sm">
            <Logo className="size-full p-0.5" />
          </div>
          <h2 className="text-foreground text-lg/tight font-bold tracking-tight">
            Yopem
          </h2>
        </div>
        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          <Link
            className="text-muted-foreground hover:text-foreground/80 transition-colors"
            href="/marketplace"
          >
            Marketplace
          </Link>
          {session && (
            <Link
              className="text-muted-foreground hover:text-foreground/80 transition-colors"
              href="/dashboard"
            >
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {session ? (
              <Link href="/dashboard">
                <Button variant="ghost" className="h-9">
                  {session.name ?? session.email}
                </Button>
              </Link>
            ) : (
              <form action={login}>
                <Button variant="ghost" className="h-9" type="submit">
                  Login
                </Button>
              </form>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Header
