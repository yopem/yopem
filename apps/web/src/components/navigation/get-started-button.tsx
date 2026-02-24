import { login } from "@repo/auth/login"
import { cn } from "@repo/ui"
import { Button } from "@repo/ui/button"

const GetStartedButton = ({ className }: { className?: string }) => {
  return (
    <form action={login}>
      <Button
        type="submit"
        size="lg"
        className={cn(
          `h-11 rounded-full px-8 text-sm font-medium shadow-sm transition-transform hover:scale-105 active:scale-95`,
          className,
        )}
      >
        Get Started
      </Button>
    </form>
  )
}

export default GetStartedButton
