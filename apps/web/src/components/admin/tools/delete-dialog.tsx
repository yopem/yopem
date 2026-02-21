"use client"

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@repo/ui/alert-dialog"
import { Button } from "@repo/ui/button"
import type { UseMutationResult } from "@tanstack/react-query"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toolName: string | undefined
  onConfirm: () => void
  deleteMutation: UseMutationResult<void, Error, string, unknown>
}

const DeleteDialog = ({
  open,
  onOpenChange,
  toolName,
  onConfirm,
  deleteMutation,
}: DeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogBackdrop />
      <AlertDialogPopup>
        <AlertDialogTitle>Delete Tool</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete "{toolName}"? This action cannot be
          undone.
        </AlertDialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <AlertDialogClose>
            <Button variant="outline">Cancel</Button>
          </AlertDialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

export default DeleteDialog
