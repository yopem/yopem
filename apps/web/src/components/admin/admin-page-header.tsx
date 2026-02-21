import { type ReactNode } from "react"

interface AdminPageHeaderProps {
  title: string
  description: string
  action?: ReactNode
}

const AdminPageHeader = ({
  title,
  description,
  action,
}: AdminPageHeaderProps) => {
  return (
    <div className="flex flex-col justify-between gap-6 pb-2 md:flex-row md:items-end">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-3xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export default AdminPageHeader
