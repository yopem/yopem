"use client"

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "ui/button"
import { Label } from "ui/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"
import { cn } from "ui/utils"
import type { ApiKeyConfig } from "utils/api-input"

import {
  CategorySelector,
  type CategorySelectorType,
} from "@/components/categories-tags/category-selector"

import { ApiKeySelector } from "./api-key-selector"
import { ModelSelector } from "./model-selector"
import { PricingSection } from "./pricing-section"
import { TagSelector, type TagSelectorType } from "./tag-selector"
import { ThumbnailSelector } from "./thumbnail-selector"

interface ConfigValues {
  modelEngine: string
  outputFormat: "plain" | "json" | "image" | "video"
  costPerRun: number
  markup: number
  apiKeyId?: string
  apiKeyError?: string
  modelOptions: string[]
  availableApiKeys: ApiKeyConfig[]
  categoryIds?: string[]
  tagIds?: string[]
  categories?: CategorySelectorType[]
  tags?: TagSelectorType[]
  thumbnailId?: string
}

interface ConfigHandlers {
  onModelEngineChange: (value: string) => void
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

export function ConfigurationPanel({
  config,
  handlers,
}: ConfigurationPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    modelEngine,
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

  const hasAdvanced = [
    onCategoriesChange,
    onTagsChange,
    onThumbnailIdChange,
  ].some(Boolean)

  return (
    <aside className="bg-background border-border flex w-80 flex-col gap-6 overflow-y-auto border-l p-6">
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
          <Label htmlFor="model-engine">Model Engine</Label>
          <ModelSelector
            id="model-engine"
            value={modelEngine}
            onChange={onModelEngineChange}
            options={modelOptions}
          />
        </div>
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

      {hasAdvanced && (
        <>
          <div className="bg-border h-px w-full" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="justify-between"
          >
            <span className="text-muted-foreground text-sm font-medium">
              Advanced options
            </span>
            {showAdvanced ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </Button>
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-200 ease-out",
              showAdvanced ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="flex min-h-0 flex-col gap-6 overflow-hidden">
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

              {onThumbnailIdChange && (
                <ThumbnailSelector
                  value={config.thumbnailId}
                  onChange={onThumbnailIdChange}
                />
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
