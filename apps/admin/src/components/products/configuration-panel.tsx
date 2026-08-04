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
    thumbnailId,
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

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Configure</h3>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Choose the AI provider and model, set pricing, and organize how the
          product appears.
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
        </div>

        <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
          <div className="flex flex-col gap-2 p-6">
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
          <div className="border-border border-b p-4">
            <span className="text-sm font-semibold">Usage Pricing</span>
          </div>
          <div className="p-6">
            <PricingSection
              costPerRun={costPerRun}
              markup={markup}
              onCostPerRunChange={onCostPerRunChange}
              onMarkupChange={onMarkupChange}
            />
          </div>
        </div>

        {onThumbnailIdChange && (
          <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
            <div className="border-border border-b p-4">
              <span className="text-sm font-semibold">Thumbnail</span>
            </div>
            <div className="p-6">
              <ThumbnailSelector
                value={thumbnailId}
                onChange={onThumbnailIdChange}
              />
            </div>
          </div>
        )}
      </div>

      {[onCategoriesChange, onTagsChange].some(Boolean) && (
        <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
          <div className="border-border border-b p-4">
            <span className="text-sm font-semibold">Organization</span>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-2">
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
          </div>
        </div>
      )}
    </section>
  )
}
