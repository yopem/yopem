import { KeyIcon } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ProviderCardSkeleton = () => {
  return (
    <Card>
      <CardHeader className="bg-card/50 flex-row items-center justify-between border-b p-6">
        <div className="flex items-center gap-4">
          <div className="bg-foreground flex size-10 items-center justify-center rounded-md">
            <KeyIcon className="text-background size-6" />
          </div>
          <div>
            <h3 className="text-foreground font-medium">Loading...</h3>
            <p className="text-muted-foreground text-xs">Loading provider...</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          <Label>Secret Key</Label>
          <Input
            type="password"
            value="loading..."
            readOnly
            className="font-mono text-sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default ProviderCardSkeleton
