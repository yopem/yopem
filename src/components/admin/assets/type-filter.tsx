"use client"

import { Button } from "@/components/ui/button"

type AssetType = "images" | "videos" | "documents" | "archives" | "others"

const typeFilters: { value: AssetType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
  { value: "documents", label: "Documents" },
  { value: "archives", label: "Archives" },
]

interface TypeFilterProps {
  selectedType: AssetType | "all"
  onTypeChange: (type: AssetType | "all") => void
}

export function TypeFilter({ selectedType, onTypeChange }: TypeFilterProps) {
  return (
    <div className="flex gap-2">
      {typeFilters.map((filter) => (
        <Button
          key={filter.value}
          variant={selectedType === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
