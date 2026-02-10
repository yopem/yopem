"use client"

import { XIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
import ModelSelect from "./model-select"
import RangeSlider from "./range-slider"

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface Tag {
  id: string
  name: string
  slug: string
}

export interface ConfigValues {
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
  categoryId?: string
  tagIds?: string[]
  categories?: Category[]
  tags?: Tag[]
}

export interface ConfigHandlers {
  onModelEngineChange: (value: string) => void
  onTemperatureChange: (value: number) => void
  onMaxTokensChange: (value: number) => void
  onOutputFormatChange: (value: "plain" | "json" | "image" | "video") => void
  onCostPerRunChange: (value: number) => void
  onMarkupChange: (value: number) => void
  onApiKeyIdChange?: (value: string) => void
  onCategoryChange?: (value: string) => void
  onTagsChange?: (value: string[]) => void
  onAddNewCategory?: () => void
  onAddNewTag?: () => void
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
    categoryId,
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
    onCategoryChange,
    onTagsChange,
    onAddNewCategory,
    onAddNewTag,
  } = handlers

  const [tagSearchQuery, setTagSearchQuery] = useState("")

  const markupPercentage = Math.round(markup * 100)

  const selectedTags = tags.filter((tag) => tagIds.includes(tag.id))
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()),
  )

  const toggleTag = (tagId: string) => {
    if (!onTagsChange) return
    if (tagIds.includes(tagId)) {
      onTagsChange(tagIds.filter((id) => id !== tagId))
    } else {
      onTagsChange([...tagIds, tagId])
    }
  }

  return (
    <aside className="bg-background flex w-80 flex-col gap-6 overflow-y-auto border-l p-6">
      <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
        Configuration
      </h3>

      <div className="border-border flex flex-col gap-3 rounded-lg border">
        <div className="border-border flex items-center justify-between border-b p-3">
          <h4 className="text-sm font-semibold">Category</h4>
          {onAddNewCategory && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onAddNewCategory}
              className="h-auto p-0 text-xs"
            >
              + Add New
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 px-3 pb-3">
          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-xs">
                No categories available
              </p>
            ) : (
              <>
                <label className="flex cursor-pointer items-center gap-2 rounded p-2 transition-colors hover:bg-muted/50">
                  <Checkbox
                    checked={!categoryId}
                    onCheckedChange={() => onCategoryChange?.("")}
                  />
                  <span className="text-sm">Uncategorized</span>
                </label>
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 transition-colors hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={categoryId === category.id}
                      onCheckedChange={() => onCategoryChange?.(category.id)}
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-border flex flex-col gap-3 rounded-lg border">
        <div className="border-border flex items-center justify-between border-b p-3">
          <h4 className="text-sm font-semibold">Tags</h4>
          {onAddNewTag && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onAddNewTag}
              className="h-auto p-0 text-xs"
            >
              + Add New
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3 px-3 pb-3">
          <Input
            value={tagSearchQuery}
            onChange={(e) => setTagSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="h-8 text-sm"
          />
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-xs">
                No tags available
              </p>
            ) : filteredTags.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-xs">
                No matching tags
              </p>
            ) : (
              filteredTags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-2 rounded p-2 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={tagIds.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  />
                  <span className="text-sm">{tag.name}</span>
                </label>
              ))
            )}
          </div>
          {selectedTags.length > 0 && (
            <div className="border-border flex flex-wrap gap-1 border-t pt-3">
              {selectedTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

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
      <div className="flex flex-col gap-4">
        <span className="text-sm font-medium">Usage Pricing</span>
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
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={markupPercentage}
                onChange={(e) => {
                  const percentage = Number(e.target.value)
                  if (percentage >= 0 && percentage <= 100) {
                    onMarkupChange(percentage / 100)
                  }
                }}
                className="border-input focus:border-foreground w-12 border-b bg-transparent p-0 text-right font-mono text-sm focus:outline-none"
              />
              <span className="text-muted-foreground font-mono text-xs">%</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default ConfigurationPanel
