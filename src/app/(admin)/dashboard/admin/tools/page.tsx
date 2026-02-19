"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import DeleteDialog from "@/components/admin/tools/delete-dialog"
import ToolsTable from "@/components/admin/tools/tools-table"
import Link from "@/components/link"
import { Button } from "@/components/ui/button"
import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

interface Tool {
  id: string
  name: string
  description: string | null
  status: string
  costPerRun: string | null
  createdAt: Date | null
}

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
          tools: Tool[]
          nextCursor: string | undefined
        }
      | undefined
    refetch: () => void
  } & { isLoading: boolean }

  const tools = useMemo(() => toolsData?.tools ?? [], [toolsData])

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
    onError: (error: Error) => {
      toastManager.add({
        title: "Error deleting tool",
        description: error.message,
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
    onError: (error: Error) => {
      toastManager.add({
        title: "Error duplicating tool",
        description: error.message,
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
    onError: (error: Error) => {
      toastManager.add({
        title: "Error updating tools",
        description: error.message,
        type: "error",
      })
    },
  })

  const handleDeleteClick = useCallback(
    (tool: { id: string; name: string }) => {
      setSelectedTool(tool)
      setDeleteDialogOpen(true)
    },
    [],
  )

  const handleConfirmDelete = useCallback(() => {
    if (selectedTool) {
      deleteToolMutation.mutate(selectedTool.id)
    }
  }, [selectedTool, deleteToolMutation])

  const handleToggleAll = useCallback(() => {
    if (selectedToolIds.length === tools.length) {
      setSelectedToolIds([])
    } else {
      setSelectedToolIds(tools.map((t) => t.id))
    }
  }, [selectedToolIds.length, tools])

  const handleToggleTool = useCallback((toolId: string) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId],
    )
  }, [])

  const handleBulkUpdateStatus = useCallback(
    (status: "draft" | "active" | "archived") => {
      bulkUpdateStatusMutation.mutate({ ids: selectedToolIds, status })
    },
    [bulkUpdateStatusMutation, selectedToolIds],
  )

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
        <ToolsTable
          tools={tools}
          isLoading={isLoading}
          selectedToolIds={selectedToolIds}
          onToggleAll={handleToggleAll}
          onToggleTool={handleToggleTool}
          onDelete={handleDeleteClick}
          duplicateMutation={duplicateToolMutation}
        />
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        toolName={selectedTool?.name}
        onConfirm={handleConfirmDelete}
        deleteMutation={deleteToolMutation}
      />
    </div>
  )
}

export default ToolsPage
