"use client"

import { Switch } from "@/components/ui/switch"

interface ProjectRestrictionToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

const ProjectRestrictionToggle = ({
  enabled,
  onToggle,
}: ProjectRestrictionToggleProps) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col">
        <span className="text-foreground text-sm font-medium">
          Project Restrictions
        </span>
        <span className="text-muted-foreground text-xs">
          Limit this key to specific project IDs
        </span>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  )
}

export default ProjectRestrictionToggle
