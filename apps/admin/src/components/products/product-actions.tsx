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

interface Product {
  id: string
  name: string
  description: string | null
  status: string
  costPerRun: string | null
  createdAt: Date | null
}

interface ProductActionsProps {
  product: Product
  onDelete: (product: { id: string; name: string }) => void
  duplicateMutation: UseMutationResult<
    { id: string } | null,
    Error,
    string,
    unknown
  >
}

const ProductActions = ({
  product,
  onDelete,
  duplicateMutation,
}: ProductActionsProps) => {
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
                to="/products/edit/$productId"
                params={{ productId: product.id }}
              >
                <PencilIcon className="size-4" />
                Edit
              </Link>
            }
          />
          <MenuItem
            onSelect={() => duplicateMutation.mutate(product.id)}
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

export default ProductActions
export type { Product }
