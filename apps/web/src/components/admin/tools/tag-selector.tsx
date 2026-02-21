"use client"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Checkbox } from "@repo/ui/checkbox"
import { Input } from "@repo/ui/input"
import { XIcon } from "lucide-react"
import { useState } from "react"

interface Tag {
  id: string
  name: string
  slug: string
}

interface TagSelectorProps {
  tags: Tag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onAddNew?: () => void
}

const TagSelector = ({
  tags,
  selectedIds,
  onChange,
  onAddNew,
}: TagSelectorProps) => {
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
    <div className="border-border flex flex-col gap-3 rounded-lg border">
      <div className="border-border flex items-center justify-between border-b p-3">
        <h4 className="text-sm font-semibold">Tags</h4>
        {onAddNew && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onAddNew}
            className="h-auto p-0 text-xs"
          >
            + Add New
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-3 px-3 pb-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>
    </div>
  )
}

export default TagSelector
export type { Tag }
