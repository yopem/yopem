"use client"

import type { AddApiKeyInput } from "@repo/api/schemas/api-keys"
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

interface AddProviderDialogProps {
  open: boolean
  formData: AddApiKeyInput
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onFormDataChange: (data: AddApiKeyInput) => void
  onSubmit: () => void
  onCancel: () => void
}

const AddProviderDialog = ({
  open,
  formData,
  isPending,
  onOpenChange,
  onFormDataChange,
  onSubmit,
  onCancel,
}: AddProviderDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Provider</DialogTitle>
          <DialogDescription>
            Add a new AI provider API key to your account
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => {
                  if (value)
                    onFormDataChange({
                      ...formData,
                      provider: value,
                    })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  onFormDataChange({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Production OpenAI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="e.g., Used for GPT-4 and Embeddings"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  onFormDataChange({ ...formData, apiKey: e.target.value })
                }
                placeholder="sk-proj-..."
              />
            </div>
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending || !formData.name || !formData.apiKey}
          >
            {isPending ? "Adding..." : "Add Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddProviderDialog
