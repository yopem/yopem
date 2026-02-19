"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ApiKeyConfig } from "@/lib/schemas/api-keys"

import ApiKeySelector from "./api-key-selector"
import CategorySelector, { type Category } from "./category-selector"
import ModelSelect from "./model-select"
import PricingSection from "./pricing-section"
import RangeSlider from "./range-slider"
import TagSelector, { type Tag } from "./tag-selector"
import ThumbnailSelector from "./thumbnail-selector"

interface ConfigValues {
  modelEngine: string
  temperature: number
  maxTokens: number
  outputFormat: "plain" | "json" | "image" | "video"
  costPerRun: number
  markup: number
  apiKeyId?: string
  apiKeyError?: string
  modelOptions: string[]
  availableApiKeys: ApiKeyConfig[]
  categoryIds?: string[]
  tagIds?: string[]
  categories?: Category[]
  tags?: Tag[]
  thumbnailId?: string
}

interface ConfigHandlers {
  onModelEngineChange: (value: string) => void
  onTemperatureChange: (value: number) => void
  onMaxTokensChange: (value: number) => void
  onOutputFormatChange: (value: "plain" | "json" | "image" | "video") => void
  onCostPerRunChange: (value: number) => void
  onMarkupChange: (value: number) => void
  onApiKeyIdChange?: (value: string) => void
  onCategoriesChange?: (value: string[]) => void
  onTagsChange?: (value: string[]) => void
  onAddNewCategory?: () => void
  onAddNewTag?: () => void
  onThumbnailIdChange?: (value: string | undefined) => void
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
    categoryIds = [],
    tagIds = [],
    categories = [],
    tags = [],
  } = config

  const {
    onModelEngineChange,
    onTemperatureChange,
    onMaxTokensChange,
    onOutputFormatChange,
    onCostPerRunChange,
    onMarkupChange,
    onApiKeyIdChange,
    onCategoriesChange,
    onTagsChange,
    onAddNewCategory,
    onAddNewTag,
    onThumbnailIdChange,
  } = handlers

  return (
    <aside className="bg-background flex w-80 flex-col gap-6 overflow-y-auto border-l p-6">
      <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
        Configuration
      </h3>

      {onCategoriesChange && (
        <CategorySelector
          categories={categories}
          selectedIds={categoryIds}
          onChange={onCategoriesChange}
          onAddNew={onAddNewCategory}
        />
      )}

      {onTagsChange && (
        <TagSelector
          tags={tags}
          selectedIds={tagIds}
          onChange={onTagsChange}
          onAddNew={onAddNewTag}
        />
      )}

      <div className="bg-border h-px w-full" />

      {onThumbnailIdChange && (
        <ThumbnailSelector
          value={config.thumbnailId}
          onChange={onThumbnailIdChange}
        />
      )}

      <div className="bg-border h-px w-full" />

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
          <Label htmlFor="model-engine">Model Engine</Label>
          <ModelSelect
            id="model-engine"
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="output-format">Output Format</Label>
        <Select
          value={outputFormat}
          onValueChange={(value) => {
            if (
              value === "plain" ||
              value === "json" ||
              value === "image" ||
              value === "video"
            ) {
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

      <div className="bg-border h-px w-full" />

      <PricingSection
        costPerRun={costPerRun}
        markup={markup}
        onCostPerRunChange={onCostPerRunChange}
        onMarkupChange={onMarkupChange}
      />
    </aside>
  )
}

export default ConfigurationPanel
