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
import { addApiKeyInputSchema, type AddApiKeyInput } from "utils/api-input"

import { providerNames } from "@/lib/utils/provider"

const providerOptions = Object.entries(providerNames).map(([value, label]) => ({
  value,
  label,
}))

interface AddProviderDialogProps {
  open: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AddApiKeyInput) => void
  onCancel: () => void
}

export function AddProviderDialog({
  open,
  isPending,
  onOpenChange,
  onSubmit,
  onCancel,
}: AddProviderDialogProps) {
  const form = useForm({
    defaultValues: {
      provider: "openai" as AddApiKeyInput["provider"],
      name: "",
      description: "",
      apiKey: "",
      status: "active" as AddApiKeyInput["status"],
      skipValidation: false,
    },
    onSubmit: ({ value }) => {
      onSubmit({
        provider: value.provider,
        name: value.name,
        description: value.description || undefined,
        apiKey: value.apiKey,
        status: value.status,
        skipValidation: value.skipValidation,
      })
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        provider: "openai",
        name: "",
        description: "",
        apiKey: "",
        status: "active",
        skipValidation: false,
      })
    }
  }, [open, form])

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
            <form.Field name="provider">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (typeof value === "string") {
                        field.handleChange(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider">
                        {
                          providerOptions.find(
                            (opt) => opt.value === field.state.value,
                          )?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {providerOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
            <form.Field
              name="name"
              validators={{
                onMount: addApiKeyInputSchema.entries.name,
                onChange: addApiKeyInputSchema.entries.name,
                onSubmit: addApiKeyInputSchema.entries.name,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Production OpenAI"
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
                onChange: addApiKeyInputSchema.entries.description.wrapped,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Used for GPT-4 and Embeddings"
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
              name="apiKey"
              validators={{
                onMount: addApiKeyInputSchema.entries.apiKey,
                onChange: addApiKeyInputSchema.entries.apiKey,
                onSubmit: addApiKeyInputSchema.entries.apiKey,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(e.target.value.replace(/\s+/g, ""))
                    }
                    placeholder="sk-proj-..."
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive-foreground text-xs">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field name="skipValidation">
              {(field) => (
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm" htmlFor="skipValidation">
                      Skip validation
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Save the key without contacting the provider
                    </p>
                  </div>
                  <Switch
                    id="skipValidation"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
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
                {isPending ? "Adding..." : "Add Provider"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
