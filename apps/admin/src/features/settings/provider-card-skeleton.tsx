import { Spinner } from "ui/spinner"

export function ProviderCardSkeleton() {
  return (
    <div className="flex h-40 w-full items-center justify-center rounded-lg border p-8">
      <Spinner className="text-muted-foreground size-8" />
    </div>
  )
}
