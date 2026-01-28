"use client"

import type { ApiKeyConfig } from "@/lib/schemas/api-keys"
import ApiKeySelector from "./api-key-selector"
import ModelSelect from "./model-select"
import OutputFormatToggle from "./output-format-toggle"
import RangeSlider from "./range-slider"

export interface ConfigValues {
  modelEngine: string
  temperature: number
  maxTokens: number
  outputFormat: "plain" | "json"
  costPerRun: number
  markup: number
  apiKeyId?: string
  apiKeyError?: string
  modelOptions: string[]
  availableApiKeys: ApiKeyConfig[]
}

export interface ConfigHandlers {
  onModelEngineChange: (value: string) => void
  onTemperatureChange: (value: number) => void
  onMaxTokensChange: (value: number) => void
  onOutputFormatChange: (value: "plain" | "json") => void
  onCostPerRunChange: (value: number) => void
  onApiKeyIdChange?: (value: string) => void
}

interface ConfigurationPanelProps {
  config: ConfigValues
  handlers: ConfigHandlers
}

const ConfigurationPanel = ({ config, handlers }: ConfigurationPanelProps) => {
  const {
    modelEngine,
    temperature,
    maxTokens,
    outputFormat,
    costPerRun,
    markup,
    modelOptions,
    apiKeyId,
    availableApiKeys,
    apiKeyError,
  } = config

  const {
    onModelEngineChange,
    onTemperatureChange,
    onMaxTokensChange,
    onOutputFormatChange,
    onCostPerRunChange,
    onApiKeyIdChange,
  } = handlers

  const markupPercentage = Math.round(markup * 100)

  return (
    <aside className="bg-background flex w-80 flex-col gap-8 overflow-y-auto border-l p-6">
      <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
        Configuration
      </h3>
      <div className="flex flex-col gap-5">
        {onApiKeyIdChange && (
          <ApiKeySelector
            value={apiKeyId}
            onChange={onApiKeyIdChange}
            availableKeys={availableApiKeys}
            error={apiKeyError}
          />
        )}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Model Engine</label>
          <ModelSelect
            value={modelEngine}
            onChange={onModelEngineChange}
            options={modelOptions}
          />
        </div>
        <RangeSlider
          label="Temperature"
          value={temperature}
          min={0}
          max={1}
          step={0.1}
          onChange={onTemperatureChange}
          formatValue={(v) => v.toFixed(1)}
        />
        <RangeSlider
          label="Max Tokens"
          value={maxTokens}
          min={256}
          max={4096}
          step={256}
          onChange={onMaxTokensChange}
          formatValue={(v) => v.toString()}
        />
      </div>
      <div className="bg-border h-px w-full" />
      <OutputFormatToggle
        value={outputFormat}
        onChange={onOutputFormatChange}
      />
      <div className="bg-border h-px w-full" />
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium">Usage Pricing</label>
        <div className="bg-muted/50 flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Cost per run
            </span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">$</span>
              <input
                type="number"
                value={costPerRun}
                onChange={(e) => {
                  const newValue = Number(e.target.value)
                  onCostPerRunChange(newValue)
                }}
                className="border-input focus:border-foreground w-16 border-b bg-transparent p-0 text-right font-mono text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Markup
            </span>
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs font-bold">
              +{markupPercentage}%
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default ConfigurationPanel
