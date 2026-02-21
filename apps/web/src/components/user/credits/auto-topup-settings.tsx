"use client"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { Switch } from "@repo/ui/switch"
import type { UseMutationResult } from "@tanstack/react-query"
import { ZapIcon } from "lucide-react"

interface AutoTopupState {
  enabled: boolean
  threshold: string
  amount: string
}

interface AutoTopupSettingsProps {
  autoTopup: AutoTopupState
  updateMutation: UseMutationResult<
    {
      success: boolean
      enabled: boolean
      threshold: number | null
      amount: number | null
    },
    Error,
    { enabled: boolean; threshold?: number; amount?: number },
    unknown
  >
  onEnabledChange: (enabled: boolean) => void
  onThresholdChange: (value: string) => void
  onAmountChange: (value: string) => void
  onSave: () => void
  calculateCredits: (amount: number) => number
}

const AutoTopupSettings = ({
  autoTopup,
  updateMutation,
  onEnabledChange,
  onThresholdChange,
  onAmountChange,
  onSave,
  calculateCredits,
}: AutoTopupSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ZapIcon className="size-5" />
          Auto Top-up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-topup-enabled">Enable Auto Top-up</Label>
            <p className="text-muted-foreground text-sm">
              Automatically purchase credits when balance is low
            </p>
          </div>
          <Switch
            id="auto-topup-enabled"
            checked={autoTopup.enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>

        {autoTopup.enabled && (
          <>
            <div>
              <Label htmlFor="threshold">Threshold (credits)</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                max="1000"
                placeholder="Trigger when balance falls below"
                value={autoTopup.threshold}
                onChange={(e) => onThresholdChange(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="auto-amount">Top-up Amount (USD)</Label>
              <Input
                id="auto-amount"
                type="number"
                min="1"
                max="1000"
                step="0.01"
                placeholder="Amount to purchase"
                value={autoTopup.amount}
                onChange={(e) => onAmountChange(e.target.value)}
                className="mt-2"
              />
              {autoTopup.amount &&
                !Number.isNaN(Number.parseFloat(autoTopup.amount)) && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    Will purchase{" "}
                    {calculateCredits(Number.parseFloat(autoTopup.amount))}{" "}
                    credits
                  </p>
                )}
            </div>

            <Button
              onClick={onSave}
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending
                ? "Saving..."
                : "Save Auto Top-up Settings"}
            </Button>
          </>
        )}

        {!autoTopup.enabled && (
          <Button
            onClick={onSave}
            disabled={updateMutation.isPending}
            variant="outline"
            className="w-full"
          >
            Save Settings
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default AutoTopupSettings
