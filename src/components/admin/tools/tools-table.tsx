"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import Link from "@/components/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateOnly } from "@/lib/utils/format-date"

import ToolActions, { type Tool } from "./tool-actions"

interface ToolsTableProps {
  tools: Tool[]
  isLoading: boolean
  selectedToolIds: string[]
  onToggleAll: () => void
  onToggleTool: (toolId: string) => void
  onDelete: (tool: { id: string; name: string }) => void
  duplicateMutation: UseMutationResult<{ id: string }, Error, string, unknown>
}

const ToolsTable = ({
  tools,
  isLoading,
  selectedToolIds,
  onToggleAll,
  onToggleTool,
  onDelete,
  duplicateMutation,
}: ToolsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={
                tools.length > 0 && selectedToolIds.length === tools.length
              }
              onCheckedChange={onToggleAll}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Runs</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={`skeleton-${i}`}>
              <TableCell>
                <Checkbox checked={false} disabled />
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">Loading...</span>
              </TableCell>
              <TableCell>
                <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Loading
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">-</TableCell>
              <TableCell className="text-muted-foreground text-right">
                -
              </TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          ))
        ) : tools.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center">
              <p className="text-muted-foreground">No tools found</p>
              <Link
                href="/dashboard/admin/tools/add"
                className="mt-2 inline-block"
              >
                <Button variant="outline" size="sm">
                  Create your first tool
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ) : (
          tools.map((tool) => (
            <TableRow key={tool.id}>
              <TableCell>
                <Checkbox
                  checked={selectedToolIds.includes(tool.id)}
                  onCheckedChange={() => onToggleTool(tool.id)}
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/admin/tools/edit/${tool.id}`}
                  className="font-medium hover:underline"
                >
                  {tool.name}
                </Link>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    tool.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : tool.status === "draft"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {tool.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateOnly(tool.createdAt) || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                -
              </TableCell>
              <TableCell>
                <ToolActions
                  tool={tool}
                  onDelete={onDelete}
                  duplicateMutation={duplicateMutation}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default ToolsTable
