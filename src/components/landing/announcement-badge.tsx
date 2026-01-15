import { ArrowRightIcon } from "lucide-react"

const AnnouncementBadge = () => {
  return (
    <div className="bg-card hover:bg-muted mb-8 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors">
      <span className="bg-primary mr-2 flex h-2 w-2 animate-pulse rounded-full" />
      <span className="text-muted-foreground">v1.0 is now live</span>
      <ArrowRightIcon className="ml-2 h-4 w-4" />
    </div>
  )
}

export default AnnouncementBadge
