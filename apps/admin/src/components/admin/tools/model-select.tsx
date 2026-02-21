"use client"

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@repo/ui/combobox"

interface ModelSelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: string[]
}

const ModelSelect = ({ id, value, onChange, options }: ModelSelectProps) => {
  const items = options.map((option) => ({ value: option, label: option }))
  const selectedItem = items.find((item) => item.value === value) ?? null

  return (
    <Combobox
      value={selectedItem}
      items={items}
      onValueChange={(newValue) => {
        if (newValue && typeof newValue === "object" && "value" in newValue) {
          onChange(newValue.value)
        }
      }}
    >
      <ComboboxInput id={id} placeholder="Search models..." />
      <ComboboxPopup>
        <ComboboxEmpty>No models found</ComboboxEmpty>
        <ComboboxList>
          {(item: { value: string; label: string }) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

export default ModelSelect
