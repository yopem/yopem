"use client"

import type { ApiKeyConfig } from "@repo/shared/api-keys-schema"

import { Button } from "@repo/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@repo/ui/dialog"

import { providerNames } from "./provider-card"

interface DeleteProviderDialogProps {
  open: boolean
  provider: ApiKeyConfig | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  onCancel: () => void
}

const DeleteProviderDialog = ({
  open,
  provider,
  isPending,
  onOpenChange,
  onSubmit,
  onCancel,
}: DeleteProviderDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Provider</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this provider? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {provider && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-foreground font-medium">{provider.name}</p>
              <p className="text-muted-foreground text-sm">
                {provider.description ?? providerNames[provider.provider]}
              </p>
            </div>
          )}
        </DialogPanel>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteProviderDialog
