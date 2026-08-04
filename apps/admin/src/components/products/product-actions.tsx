"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { Link } from "@tanstack/react-router"
import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import type { SelectProduct } from "db/schema/products"
import { Button } from "ui/button"
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuTrigger,
} from "ui/menu"

export type Product = Pick<
  SelectProduct,
  "id" | "name" | "description" | "status" | "costPerRun" | "createdAt"
>

interface ProductActionsProps {
  product: Product
  onDelete: (product: { id: string; name: string }) => void
  duplicateMutation: UseMutationResult<
    { id: string } | null,
    Error,
    { id: string },
    unknown
  >
}

export function ProductActions({
  product,
  onDelete,
  duplicateMutation,
}: ProductActionsProps) {
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
          <MenuLinkItem
            render={
              <Link
                className="text-foreground hover:bg-accent"
                to="/products/edit/$productId"
                params={{ productId: product.id }}
              >
                <PencilIcon className="size-4" />
                Edit
              </Link>
            }
          />
          <MenuItem
            onSelect={() => duplicateMutation.mutate({ id: product.id })}
            disabled={duplicateMutation.isPending}
          >
            <CopyIcon className="size-4" />
            {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
          </MenuItem>
          <MenuItem
            onSelect={() =>
              onDelete({
                id: product.id,
                name: product.name,
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
  )
}
