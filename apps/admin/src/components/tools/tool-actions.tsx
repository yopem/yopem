"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { Link } from "@tanstack/react-router"
import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "ui/button"
import { Menu, MenuGroup, MenuItem, MenuPopup, MenuTrigger } from "ui/menu"

interface Tool {
  id: string
  name: string
  description: string | null
  status: string
  costPerRun: string | null
  createdAt: Date | null
}

interface ToolActionsProps {
  tool: Tool
  onDelete: (tool: { id: string; name: string }) => void
  duplicateMutation: UseMutationResult<
    { id: string } | null,
    Error,
    string,
    unknown
  >
}

const ToolActions = ({
  tool,
  onDelete,
  duplicateMutation,
}: ToolActionsProps) => {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        }
      />
      <MenuPopup>
        <MenuGroup>
          <MenuItem
            render={
              <Link
                className="text-foreground hover:bg-accent"
                to="/tools/edit/$toolId"
                params={{ toolId: tool.id }}
              >
                <PencilIcon className="size-4" />
                Edit
              </Link>
            }
          />
          <MenuItem
            onSelect={() => duplicateMutation.mutate(tool.id)}
            disabled={duplicateMutation.isPending}
          >
            <CopyIcon className="size-4" />
            {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
          </MenuItem>
          <MenuItem
            onSelect={() => onDelete({ id: tool.id, name: tool.name })}
            variant="destructive"
          >
            <Trash2Icon className="size-4" />
            Delete
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  )
}

export default ToolActions
export type { Tool }
