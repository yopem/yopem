import { useState } from "react"

import { Button } from "ui/button"
import { Card, CardPanel } from "ui/card"
import { Input } from "ui/input"
import { Label } from "ui/label"

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
  const [maxUploadSize, setMaxUploadSize] = useState(defaultMaxUploadSize)

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
            <div className="space-y-2">
              <Label htmlFor="max-upload-size">Maximum Upload Size (MB)</Label>
              <Input
                id="max-upload-size"
                type="number"
                min={1}
                max={500}
                value={maxUploadSize}
                onChange={(e) => setMaxUploadSize(Number(e.target.value))}
              />
              <p className="text-muted-foreground text-xs">
                Set the maximum file size allowed for uploads (1-500 MB)
              </p>
            </div>
            <Button onClick={() => onSave(maxUploadSize)} disabled={isLoading}>
              Save Settings
            </Button>
          </div>
        </CardPanel>
      </Card>
    </div>
  )
}
