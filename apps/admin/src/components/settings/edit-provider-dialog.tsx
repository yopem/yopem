"use client"

import type { ApiKeyConfig } from "@repo/shared/api-keys-schema"

import { Button } from "@repo/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@repo/ui/dialog"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select"
import { Textarea } from "@repo/ui/textarea"

interface EditProviderDialogProps {
  open: boolean
  provider: ApiKeyConfig | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onProviderChange: (provider: ApiKeyConfig) => void
  onSubmit: () => void
  onCancel: () => void
}

const EditProviderDialog = ({
  open,
  provider,
  isPending,
  onOpenChange,
  onProviderChange,
  onSubmit,
  onCancel,
}: EditProviderDialogProps) => {
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
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={provider.status}
                  onValueChange={(value) => {
                    if (value) {
                      onProviderChange({ ...provider, status: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
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

export default EditProviderDialog
