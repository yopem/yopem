import { cn } from "ui"

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn(
        "border-primary size-8 animate-spin rounded-full border-2 border-t-transparent",
        className,
      )}
      {...props}
    />
  )
}

export { Spinner }
