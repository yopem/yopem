"use client"

import { Button } from "ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "ui/dialog"
import { Input } from "ui/input"
import { Label } from "ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select"
import { Switch } from "ui/switch"
import { Textarea } from "ui/textarea"
import type { ApiKeyConfig } from "utils/api-input"

interface EditProviderDialogProps {
  open: boolean
  provider: ApiKeyConfig | null
  newApiKey: string
  skipValidation: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onProviderChange: (provider: ApiKeyConfig) => void
  onNewApiKeyChange: (value: string) => void
  onSkipValidationChange: (checked: boolean) => void
  onSubmit: () => void
  onCancel: () => void
}

export function EditProviderDialog({
  open,
  provider,
  newApiKey,
  skipValidation,
  isPending,
  onOpenChange,
  onProviderChange,
  onNewApiKeyChange,
  onSkipValidationChange,
  onSubmit,
  onCancel,
}: EditProviderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Provider</DialogTitle>
          <DialogDescription>
            Update provider settings and configuration
          </DialogDescription>
        </DialogHeader>
        {provider && (
          <DialogPanel>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={provider.name}
                  onChange={(e) =>
                    onProviderChange({ ...provider, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={provider.description ?? ""}
                  onChange={(e) =>
                    onProviderChange({
                      ...provider,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apiKey">API Key</Label>
                <Input
                  id="edit-apiKey"
                  type="password"
                  value={newApiKey}
                  onChange={(e) =>
                    onNewApiKeyChange(e.target.value.replace(/\s+/g, ""))
                  }
                  placeholder="Leave blank to keep current key"
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm" htmlFor="edit-skipValidation">
                    Skip validation
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Save the key without contacting the provider
                  </p>
                </div>
                <Switch
                  id="edit-skipValidation"
                  checked={skipValidation}
                  onCheckedChange={onSkipValidationChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={provider.status}
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      onProviderChange({ ...provider, status: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogPanel>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
