"use client"

import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"

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
import {
  updateApiKeyInputSchema,
  type ApiKeyConfig,
  type UpdateApiKeyInput,
} from "utils/api-input"

interface EditProviderDialogProps {
  open: boolean
  provider: ApiKeyConfig
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UpdateApiKeyInput) => void
  onCancel: () => void
}

export function EditProviderDialog({
  open,
  provider,
  isPending,
  onOpenChange,
  onSubmit,
  onCancel,
}: EditProviderDialogProps) {
  const form = useForm({
    defaultValues: {
      id: provider.id,
      name: provider.name,
      description: provider.description ?? "",
      apiKey: "",
      status: provider.status,
      skipValidation: false,
    },
    onSubmit: ({ value }) => {
      onSubmit({
        id: value.id,
        name: value.name,
        description: value.description || undefined,
        ...(value.apiKey.trim() ? { apiKey: value.apiKey } : {}),
        status: value.status,
        skipValidation: value.skipValidation,
      })
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        id: provider.id,
        name: provider.name,
        description: provider.description ?? "",
        apiKey: "",
        status: provider.status,
        skipValidation: false,
      })
    }
  }, [open, provider, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Provider</DialogTitle>
          <DialogDescription>
            Update provider settings and configuration
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="space-y-6">
            <form.Field
              name="name"
              validators={{
                onChange: updateApiKeyInputSchema.entries.name.wrapped,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive-foreground text-xs">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field
              name="description"
              validators={{
                onChange: updateApiKeyInputSchema.entries.description.wrapped,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive-foreground text-xs">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field name="apiKey">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="edit-apiKey">API Key</Label>
                  <Input
                    id="edit-apiKey"
                    type="password"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(e.target.value.replace(/\s+/g, ""))
                    }
                    placeholder="Leave blank to keep current key"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="skipValidation">
              {(field) => (
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
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="status">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (typeof value === "string") {
                        field.handleChange(value)
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
              )}
            </form.Field>
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => state.canSubmit}>
            {(canSubmit) => (
              <Button
                onClick={() => void form.handleSubmit()}
                disabled={!canSubmit || isPending}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
