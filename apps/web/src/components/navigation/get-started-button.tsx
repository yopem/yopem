import { login } from "@repo/auth/login"
import { Button } from "@repo/ui/button"
import { cn } from "@repo/ui/lib/utils"

const GetStartedButton = ({ className }: { className?: string }) => {
  return (
    <form action={login}>
      <Button
        type="submit"
        size="lg"
        className={cn(
          `h-12 px-8 text-base font-bold shadow-sm transition-transform hover:scale-105 active:scale-95`,
          className,
        )}
      >
        Get Started
      </Button>
    </form>
  )
}

export default GetStartedButton
