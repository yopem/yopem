import { type ReactNode } from "react"

interface ActivityFeedItemProps {
  icon: ReactNode
  message: string | ReactNode
  timestamp: string
}

const ActivityFeedItem = ({
  icon,
  message,
  timestamp,
}: ActivityFeedItemProps) => {
  return (
    <div className="group hover:bg-secondary/40 flex gap-4 rounded-lg p-4 transition-colors">
      <div className="mt-0.5">
        <div className="border-sidebar-border bg-secondary group-hover:bg-secondary flex h-8 w-8 items-center justify-center rounded-full border transition-colors">
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm leading-snug">{message}</p>
        <p className="text-muted-foreground text-xs">{timestamp}</p>
      </div>
    </div>
  )
}

export default ActivityFeedItem
