"use client"

import { MoreVerticalIcon } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

import KeyInputField from "./key-input-field"
import ProjectRestrictionToggle from "./project-restriction-toggle"

interface ApiProviderCardProps {
  name: string
  description: string
  icon: ReactNode
  status: "active" | "inactive"
  apiKey: string
  lastUsed?: string
  onRegenerate?: () => void
}

const ApiProviderCard = ({
  name,
  description,
  icon,
  status,
  apiKey,
  lastUsed,
  onRegenerate,
}: ApiProviderCardProps) => {
  const [restrictionEnabled, setRestrictionEnabled] = useState(false)

  return (
    <Card>
      <CardHeader className="bg-card/50 flex-row items-center justify-between border-b p-6">
        <div className="flex items-center gap-4">
          <div className="bg-foreground flex size-10 items-center justify-center rounded-md [&>svg]:size-6">
            {icon}
          </div>
          <div>
            <h3 className="text-foreground font-medium">{name}</h3>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {status}
          </Badge>
          <Button size="icon-xs" variant="ghost">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 p-6">
        <KeyInputField
          value={apiKey}
          label="Secret Key"
          helperText={lastUsed}
          onRegenerate={onRegenerate}
        />
        <ProjectRestrictionToggle
          enabled={restrictionEnabled}
          onToggle={setRestrictionEnabled}
        />
      </CardContent>
    </Card>
  )
}

export default ApiProviderCard
