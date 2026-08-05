"use client"

import { useForm } from "@tanstack/react-form"
import * as v from "valibot"

import { Button } from "ui/button"
import { Card, CardPanel } from "ui/card"
import { Input } from "ui/input"
import { Label } from "ui/label"

const maxUploadSizeValidator = v.pipe(
  v.number(),
  v.minValue(1, "Minimum upload size is 1 MB"),
  v.maxValue(500, "Maximum upload size is 500 MB"),
)

interface AssetUploadSettingsProps {
  defaultMaxUploadSize: number
  isLoading: boolean
  onSave: (maxUploadSizeMB: number) => void
}

export function AssetUploadSettings({
  defaultMaxUploadSize,
  isLoading,
  onSave,
}: AssetUploadSettingsProps) {
  const form = useForm({
    defaultValues: {
      maxUploadSize: defaultMaxUploadSize,
    },
    onSubmit: ({ value }) => {
      onSave(value.maxUploadSize)
    },
  })

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-bold">
          Asset Upload Settings
        </h2>
      </div>
      <Card>
        <CardPanel className="p-6">
          <div className="space-y-4">
            <form.Field
              name="maxUploadSize"
              validators={{
                onMount: maxUploadSizeValidator,
                onChange: maxUploadSizeValidator,
                onSubmit: maxUploadSizeValidator,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="max-upload-size">
                    Maximum Upload Size (MB)
                  </Label>
                  <Input
                    id="max-upload-size"
                    type="number"
                    min={1}
                    max={500}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                  <p className="text-muted-foreground text-xs">
                    Set the maximum file size allowed for uploads (1-500 MB)
                  </p>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive-foreground text-xs">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.canSubmit}>
              {(canSubmit) => (
                <Button
                  onClick={() => void form.handleSubmit()}
                  disabled={!canSubmit || isLoading}
                >
                  Save Settings
                </Button>
              )}
            </form.Subscribe>
          </div>
        </CardPanel>
      </Card>
    </div>
  )
}
