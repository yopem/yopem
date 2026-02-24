"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { BadgeCheckIcon, KeyIcon } from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

import ActivityFeedItem from "@/components/dashboard/activity-feed-item"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import { useActivityFeed } from "@/hooks/use-activity-feed"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Monitoring", href: "/monitoring" },
  { label: "Activity Logs" },
]

const ActivityPage = () => {
  const { data: activityFeed, isLoading } = useActivityFeed()

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="Activity Logs"
        description="View all system events and operational activity"
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <Shimmer loading={isLoading}>
            <div className="flex flex-col">
              {activityFeed && activityFeed.length > 0 ? (
                activityFeed.map((activity) => (
                  <ActivityFeedItem
                    key={`${activity.timestamp}-${activity.message}`}
                    icon={
                      activity.type === "payment" ? (
                        <BadgeCheckIcon className="text-foreground size-4" />
                      ) : (
                        <KeyIcon className="text-foreground size-4" />
                      )
                    }
                    message={activity.message}
                    timestamp={new Date(activity.timestamp).toLocaleString()}
                  />
                ))
              ) : (
                <p className="text-muted-foreground p-4 text-center text-sm">
                  No activity found
                </p>
              )}
            </div>
          </Shimmer>
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivityPage
