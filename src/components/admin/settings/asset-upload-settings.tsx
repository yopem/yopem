import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AssetUploadSettingsProps {
  maxUploadSize: number
  isLoading: boolean
  onMaxUploadSizeChange: (value: number) => void
  onSave: () => void
}

const AssetUploadSettings = ({
  maxUploadSize,
  isLoading,
  onMaxUploadSizeChange,
  onSave,
}: AssetUploadSettingsProps) => {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-bold">
          Asset Upload Settings
        </h2>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-upload-size">Maximum Upload Size (MB)</Label>
              <Input
                id="max-upload-size"
                type="number"
                min={1}
                max={500}
                value={maxUploadSize}
                onChange={(e) => onMaxUploadSizeChange(Number(e.target.value))}
              />
              <p className="text-muted-foreground text-xs">
                Set the maximum file size allowed for uploads (1-500 MB)
              </p>
            </div>
            <Button onClick={onSave} disabled={isLoading}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AssetUploadSettings
