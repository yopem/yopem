import { Button } from "@/components/ui/button"
import { login } from "@/lib/auth/login"
import { cn } from "@/lib/utils/style"

const GetStartedButton = ({ className }: { className?: string }) => {
  return (
    <form action={login}>
      <Button
        type="submit"
        size="lg"
        className={cn(
          `h-12 px-8 text-base font-bold shadow transition-transform hover:scale-105 active:scale-95`,
          className,
        )}
      >
        Get Started
      </Button>
    </form>
  )
}

export default GetStartedButton
