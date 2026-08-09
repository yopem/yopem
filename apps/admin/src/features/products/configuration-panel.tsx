"use client"

import { Label } from "ui/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"
import type { ApiKeyConfig } from "utils/api-input"

import { ApiKeySelector } from "./api-key-selector"
import { PricingSection } from "./pricing-section"

interface ConfigValues {
  outputFormat: "plain" | "json" | "image" | "video"
  creditsPerRun: number
  apiKeyId?: string
  apiKeyError?: string
  availableApiKeys: ApiKeyConfig[]
}

type OutputFormat = "plain" | "json" | "image" | "video"

const outputFormats: readonly OutputFormat[] = [
  "plain",
  "json",
  "image",
  "video",
]

const isOutputFormat = (value: string | null): value is OutputFormat =>
  value !== null && (outputFormats as readonly string[]).includes(value)

interface ConfigHandlers {
  onOutputFormatChange: (value: "plain" | "json" | "image" | "video") => void
  onCreditsPerRunChange: (value: number) => void
  onApiKeyIdChange?: (value: string) => void
}

interface ConfigurationPanelProps {
  config: ConfigValues
  handlers: ConfigHandlers
}

export function ConfigurationPanel({
  config,
  handlers,
}: ConfigurationPanelProps) {
  const {
    outputFormat,
    creditsPerRun,
    apiKeyId,
    availableApiKeys,
    apiKeyError,
  } = config

  const { onOutputFormatChange, onCreditsPerRunChange, onApiKeyIdChange } =
    handlers

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Configure</h3>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Choose the API key, set the output format, and adjust pricing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
          <div className="grid gap-5 p-6 md:grid-cols-2">
            {onApiKeyIdChange && (
              <ApiKeySelector
                value={apiKeyId}
                onChange={onApiKeyIdChange}
                availableKeys={availableApiKeys}
                error={apiKeyError}
              />
            )}
          </div>
        </div>

        <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
          <div className="flex flex-col gap-2 p-6">
            <Label htmlFor="output-format">Output Format</Label>
            <Select
              value={outputFormat}
              onValueChange={(value) => {
                if (isOutputFormat(value)) {
                  onOutputFormatChange(value)
                }
              }}
            >
              <SelectTrigger id="output-format">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="plain">Plain Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectPopup>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
        <div className="border-border border-b p-4">
          <span className="text-sm font-semibold">Usage Pricing</span>
        </div>
        <div className="p-6">
          <PricingSection
            creditsPerRun={creditsPerRun}
            onCreditsPerRunChange={onCreditsPerRunChange}
          />
        </div>
      </div>
    </section>
  )
}
