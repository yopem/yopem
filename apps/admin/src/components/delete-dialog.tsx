"use client"

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
  title: string
  name?: string
  description?: string
  onConfirm: () => void
  isPending: boolean
}

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  name,
  description,
  onConfirm,
  isPending,
}: DeleteDialogProps) {
  const body = description ?? (
    <>Are you sure you want to delete "{name}"? This action cannot be undone.</>
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogBackdrop />
      <AlertDialogPopup className="space-y-3 p-5">
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{body}</AlertDialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <AlertDialogClose>
            <Button variant="outline">Cancel</Button>
          </AlertDialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
