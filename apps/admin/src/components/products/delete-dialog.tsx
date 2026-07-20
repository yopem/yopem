"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogTitle,
} from "ui/alert-dialog"
import { Button } from "ui/button"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string | undefined
  onConfirm: () => void
  deleteMutation: UseMutationResult<void, Error, string, unknown>
}

const DeleteDialog = ({
  open,
  onOpenChange,
  productName,
  onConfirm,
  deleteMutation,
}: DeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogBackdrop />
      <AlertDialogPopup>
        <AlertDialogTitle>Delete Product</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete "{productName}"? This action cannot be
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
