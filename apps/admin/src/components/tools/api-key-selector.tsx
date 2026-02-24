"use client"

import type { ApiKeyConfig } from "@repo/shared/api-keys-schema"

import { Label } from "@repo/ui/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select"

interface ApiKeySelectorProps {
  value?: string
  onChange: (value: string) => void
  availableKeys: ApiKeyConfig[]
  selectedProvider?: string
  error?: string
}

const providerDisplayNames: Record<string, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
}

const ApiKeySelector = ({
  value,
  onChange,
  availableKeys,
  selectedProvider,
  error,
}: ApiKeySelectorProps) => {
  const filteredKeys = selectedProvider
    ? availableKeys.filter(
        (key) => key.provider === selectedProvider && key.status === "active",
      )
    : availableKeys.filter((key) => key.status === "active")

  return (
    <div className="space-y-2">
      <Label htmlFor="api-key-selector">
        API Provider Credentials
        <span className="text-red-500">*</span>
      </Label>
      <Select
        value={value ?? ""}
        onValueChange={(newValue) => {
          if (newValue) onChange(newValue)
        }}
      >
        <SelectTrigger
          id="api-key-selector"
          className={error ? `border-red-500 focus:ring-red-500` : ""}
        >
          <SelectValue placeholder="Select an API key">
            {value && filteredKeys.find((k) => k.id === value)
              ? `${filteredKeys.find((k) => k.id === value)?.name} (${providerDisplayNames[filteredKeys.find((k) => k.id === value)?.provider ?? ""]})`
              : "Select an API key"}
          </SelectValue>
        </SelectTrigger>
        <SelectPopup>
          {filteredKeys.map((key) => (
            <SelectItem key={key.id} value={key.id}>
              {key.name} ({providerDisplayNames[key.provider]})
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {filteredKeys.length === 0 && (
        <p className="text-sm text-gray-500">
          No active API keys available
          {selectedProvider &&
            ` for ${providerDisplayNames[selectedProvider] ?? selectedProvider}`}
          . Please add one in Settings.
        </p>
      )}
    </div>
  )
}

export default ApiKeySelector
