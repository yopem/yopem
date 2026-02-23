"use client"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@repo/ui/menu"
import type { ApiKeyConfig } from "@repo/utils/api-keys-schema"
import {
  BotIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  MoreVerticalIcon,
} from "lucide-react"
import { memo, type ReactNode } from "react"

const providerIcons: Record<string, ReactNode> = {
  openai: <BotIcon className="text-background" />,
  openrouter: <KeyIcon className="text-background" />,
}

const providerNames: Record<string, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
}

interface ProviderCardProps {
  apiKey: ApiKeyConfig
  isVisible: boolean
  onToggleVisibility: (keyId: string) => void
  onEdit: (provider: ApiKeyConfig) => void
  onDelete: (provider: ApiKeyConfig) => void
  formatDateTime: (date: Date | string | null | undefined) => string
}

const ProviderCard = memo(
  ({
    apiKey,
    isVisible,
    onToggleVisibility,
    onEdit,
    onDelete,
    formatDateTime,
  }: ProviderCardProps) => {
    return (
      <Card>
        <CardHeader className="bg-card/50 flex-row items-center justify-between border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-foreground flex size-10 items-center justify-center rounded-md [&>svg]:size-6">
              {providerIcons[apiKey.provider]}
            </div>
            <div>
              <h3 className="text-foreground font-medium">{apiKey.name}</h3>
              <p className="text-muted-foreground text-xs">
                {apiKey.description ?? providerNames[apiKey.provider]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={apiKey.status === "active" ? "default" : "secondary"}
              className="capitalize"
            >
              {apiKey.status}
            </Badge>
            <Menu>
              <MenuTrigger
                render={
                  <Button size="icon-xs" variant="ghost">
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                }
              />
              <MenuPopup align="end">
                <MenuItem onClick={() => onEdit(apiKey)}>Edit</MenuItem>
                <MenuItem
                  onClick={() => onDelete(apiKey)}
                  className="text-destructive"
                >
                  Delete
                </MenuItem>
              </MenuPopup>
            </Menu>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="space-y-2">
            <Label>Secret Key</Label>
            <div className="flex gap-2">
              <Input
                type={isVisible ? "text" : "password"}
                value={apiKey.apiKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => onToggleVisibility(apiKey.id)}
              >
                {isVisible ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </Button>
            </div>
            {apiKey.lastUsed && (
              <p className="text-muted-foreground text-xs">
                Last used: {formatDateTime(apiKey.lastUsed)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  },
)

ProviderCard.displayName = "ProviderCard"

export default ProviderCard
export { providerNames }
