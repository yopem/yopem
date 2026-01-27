"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

function ToolsPage() {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])

  const {
    data: toolsData,
    isLoading,
    refetch,
  } = useQuery({
    ...queryApi.tools.list.queryOptions({
      input: {
        limit: 100,
        status: "all",
      },
    }),
  }) as {
    data:
      | {
          tools: {
            id: string
            name: string
            description: string | null
            status: string
            costPerRun: string | null
            createdAt: Date | null
          }[]
          nextCursor: string | undefined
        }
      | undefined
    refetch: () => void
  } & { isLoading: boolean }

  const deleteToolMutation = useMutation({
    mutationFn: async (id: string) => {
      await queryApi.tools.delete.call({ id })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Tool deleted",
        description: `${selectedTool?.name} has been deleted.`,
        type: "success",
      })
      setDeleteDialogOpen(false)
      setSelectedTool(null)
      refetch()
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Error deleting tool",
        description: err.message,
        type: "error",
      })
    },
  })

  const duplicateToolMutation = useMutation({
    mutationFn: async (id: string) => {
      return await queryApi.tools.duplicate.call({ id })
    },
    onSuccess: (data, variables) => {
      const originalTool = tools.find((t) => t.id === variables)
      toastManager.add({
        title: "Tool duplicated",
        description: `${originalTool?.name} has been duplicated.`,
        type: "success",
      })
      refetch()
      router.push(`/dashboard/admin/tools/edit/${data.id}`)
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Error duplicating tool",
        description: err.message,
        type: "error",
      })
    },
  })

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[]
      status: "draft" | "active" | "archived"
    }) => {
      return await queryApi.tools.bulkUpdateStatus.call({ ids, status })
    },
    onSuccess: (data, variables) => {
      toastManager.add({
        title: "Tools updated",
        description: `${data.count} tool(s) marked as ${variables.status}.`,
        type: "success",
      })
      setSelectedToolIds([])
      refetch()
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Error updating tools",
        description: err.message,
        type: "error",
      })
    },
  })

  const handleDeleteClick = (tool: { id: string; name: string }) => {
    setSelectedTool(tool)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedTool) {
      deleteToolMutation.mutate(selectedTool.id)
    }
  }

  const handleEditClick = (toolId: string) => {
    router.push(`/dashboard/admin/tools/edit/${toolId}`)
  }

  const handleToggleAll = () => {
    if (selectedToolIds.length === tools.length) {
      setSelectedToolIds([])
    } else {
      setSelectedToolIds(tools.map((t) => t.id))
    }
  }

  const handleToggleTool = (toolId: string) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId],
    )
  }

  const handleBulkUpdateStatus = (status: "draft" | "active" | "archived") => {
    bulkUpdateStatusMutation.mutate({ ids: selectedToolIds, status })
  }

  const tools = toolsData?.tools ?? []

  return (
    <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground">
            Manage and create AI-powered tools for your workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedToolIds.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleBulkUpdateStatus("active")}
                disabled={bulkUpdateStatusMutation.isPending}
              >
                Mark Active ({selectedToolIds.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkUpdateStatus("archived")}
                disabled={bulkUpdateStatusMutation.isPending}
              >
                Archive ({selectedToolIds.length})
              </Button>
            </>
          )}
          <Link href="/dashboard/admin/tools/add">
            <Button>
              <PlusIcon className="size-4" />
              <span>Create Tool</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    tools.length > 0 && selectedToolIds.length === tools.length
                  }
                  onCheckedChange={handleToggleAll}
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
                <TableRow key={i}>
                  <TableCell>
                    <div className="bg-muted h-4 w-4 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted ml-auto h-4 w-16 animate-pulse rounded" />
                  </TableCell>
                  <TableCell />
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
                      onCheckedChange={() => handleToggleTool(tool.id)}
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
                    {tool.createdAt
                      ? new Date(tool.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    -
                  </TableCell>
                  <TableCell>
                    <Menu>
                      <MenuTrigger>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </MenuTrigger>
                      <MenuPopup>
                        <MenuGroup>
                          <MenuItem onSelect={() => handleEditClick(tool.id)}>
                            <PencilIcon className="size-4" />
                            Edit
                          </MenuItem>
                          <MenuItem
                            onSelect={() =>
                              duplicateToolMutation.mutate(tool.id)
                            }
                            disabled={duplicateToolMutation.isPending}
                          >
                            <CopyIcon className="size-4" />
                            {duplicateToolMutation.isPending
                              ? "Duplicating..."
                              : "Duplicate"}
                          </MenuItem>
                          <MenuItem
                            onSelect={() =>
                              handleDeleteClick({
                                id: tool.id,
                                name: tool.name,
                              })
                            }
                            variant="destructive"
                          >
                            <Trash2Icon className="size-4" />
                            Delete
                          </MenuItem>
                        </MenuGroup>
                      </MenuPopup>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogBackdrop />
        <AlertDialogPopup>
          <AlertDialogTitle>Delete Tool</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{selectedTool?.name}"? This action
            cannot be undone.
          </AlertDialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogClose>
              <Button variant="outline">Cancel</Button>
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteToolMutation.isPending}
            >
              {deleteToolMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}

export default ToolsPage
