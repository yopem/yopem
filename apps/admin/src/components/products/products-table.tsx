"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { Link } from "@tanstack/react-router"

import { Checkbox } from "ui/checkbox"
import { Spinner } from "ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table"
import { formatDateOnly } from "utils/format-date"

import { EmptyProductState } from "@/components/onboarding/empty-product-state"

import { ProductActions, type Product } from "./product-actions"

interface ProductsTableProps {
  products: Product[]
  isLoading: boolean
  selectedProductIds: string[]
  onToggleAll: (checked: boolean) => void
  onToggleProduct: (productId: string) => void
  onDelete: (product: { id: string; name: string }) => void
  duplicateMutation: UseMutationResult<
    { id: string } | null,
    Error,
    { id: string },
    unknown
  >
}

export function ProductsTable({
  products,
  isLoading,
  selectedProductIds,
  onToggleAll,
  onToggleProduct,
  onDelete,
  duplicateMutation,
}: ProductsTableProps) {
  const selectedSet = new Set(selectedProductIds)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={
                products.length > 0 &&
                selectedProductIds.length === products.length
              }
              indeterminate={
                selectedProductIds.length > 0 &&
                selectedProductIds.length !== products.length
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
          <TableRow>
            <TableCell colSpan={6} className="h-48 text-center">
              <div className="flex items-center justify-center py-8">
                <Spinner className="text-muted-foreground size-8" />
              </div>
            </TableCell>
          </TableRow>
        ) : products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="p-0">
              <EmptyProductState />
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Checkbox
                  checked={selectedSet.has(product.id)}
                  onCheckedChange={() => onToggleProduct(product.id)}
                />
              </TableCell>
              <TableCell>
                <Link
                  to="/products/edit/$productId"
                  params={{ productId: product.id }}
                  className="font-medium hover:underline"
                >
                  {product.name}
                </Link>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    product.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : product.status === "draft"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {product.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateOnly(product.createdAt) || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                -
              </TableCell>
              <TableCell>
                <ProductActions
                  product={product}
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

export default ProductsTable
