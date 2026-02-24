"use client"

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@repo/ui/alert-dialog"
import { Button } from "@repo/ui/button"

import type { Asset } from "./asset-card"

interface DeleteAssetDialogProps {
  asset: Asset | null
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteAssetDialog({
  asset,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteAssetDialogProps) {
  return (
    <AlertDialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogBackdrop />
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Asset</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{asset?.originalName}"? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter variant="bare">
          <AlertDialogClose
            render={<Button variant="outline">Cancel</Button>}
          />
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
