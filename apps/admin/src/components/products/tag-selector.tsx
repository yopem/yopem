"use client"

import { XIcon } from "lucide-react"
import { useState } from "react"

import type { SelectTag } from "db/schema"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Checkbox } from "ui/checkbox"
import { CollapsibleCard } from "ui/collapsible-card"
import { Input } from "ui/input"
import { ScrollArea } from "ui/scroll-area"

export type TagSelectorType = Pick<SelectTag, "id" | "name" | "slug">

interface TagSelectorProps {
  tags: TagSelectorType[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onAddNew?: () => void
}

export function TagSelector({
  tags,
  selectedIds,
  onChange,
  onAddNew,
}: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const toggleTag = (tagId: string) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedIds, tagId])
    }
  }

  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id))

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <CollapsibleCard
      title="Tags"
      action={
        onAddNew && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onAddNew}
            className="h-auto p-0 text-xs"
          >
            + Add New
          </Button>
        )
      }
    >
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tags..."
        className="h-8 text-sm"
      />
      <ScrollArea className="h-40">
        <div className="flex flex-col gap-1">
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
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm p-2 transition-colors"
              >
                <Checkbox
                  checked={selectedIds.includes(tag.id)}
                  onCheckedChange={() => toggleTag(tag.id)}
                />
                <span className="text-sm">{tag.name}</span>
              </label>
            ))
          )}
        </div>
      </ScrollArea>
      {selectedTags.length > 0 && (
        <div className="border-border flex flex-wrap gap-1 border-t pt-3">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="hover:text-destructive ml-1"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </CollapsibleCard>
  )
}
