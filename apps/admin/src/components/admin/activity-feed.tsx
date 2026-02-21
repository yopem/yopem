import { Card } from "@repo/ui/card"
import { type ReactNode } from "react"

import Link from "@/components/link"

import ActivityFeedItem from "./activity-feed-item"

interface ActivityItem {
  icon: ReactNode
  message: string | ReactNode
  timestamp: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
  maxHeight?: string
}

const ActivityFeed = ({ items, maxHeight = "350px" }: ActivityFeedProps) => {
  return (
    <Card className="border-border bg-card flex h-full flex-col rounded-xl border pt-0 pb-6 shadow-sm">
      <div className="border-border flex items-center justify-between border-b p-6">
        <p className="text-foreground text-base font-bold">Recent Activity</p>
        <Link
          href="/monitoring/activity"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          View All
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto p-2" style={{ maxHeight }}>
        {items.map((item) => (
          <ActivityFeedItem
            key={item.timestamp}
            icon={item.icon}
            message={item.message}
            timestamp={item.timestamp}
          />
        ))}
      </div>
    </Card>
  )
}

export default ActivityFeed
