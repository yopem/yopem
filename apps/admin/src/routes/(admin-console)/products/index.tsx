import { useMutation, useQuery } from "@tanstack/react-query"
import { Navigate, createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { toastManager } from "ui/toast"

import type { Product } from "@/components/products/product-actions"

import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import { ProductsTable } from "@/components/products/products-table"

export const Route = createFileRoute("/(admin-console)/products/")({
  component: ProductsRouteComponent,
})

function ProductsRouteComponent() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [duplicateRedirect, setDuplicateRedirect] = useState<{
    productId: string
  } | null>(null)

  const {
    data: productsData,
    isLoading,
    refetch,
  } = useQuery(
    queryApi.products.list.queryOptions({
      input: {
        limit: 100,
        status: "all",
      },
    }),
  )

  const products = useMemo(
    () => (productsData?.products as Product[]) ?? [],
    [productsData],
  )

  const deleteProductMutation = useMutation(
    queryApi.products.delete.mutationOptions({
      onSuccess: () => {
        toastManager.add({
          title: "Product deleted",
          description: `${selectedProduct?.name} has been deleted.`,
          type: "success",
        })
        setDeleteDialogOpen(false)
        setSelectedProduct(null)
        void refetch()
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error deleting product",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const duplicateProductMutation = useMutation(
    queryApi.products.duplicate.mutationOptions({
      onSuccess: (data, variables) => {
        if (!data) {
          toastManager.add({
            title: "Error duplicating product",
            description: "Failed to duplicate product",
            type: "error",
          })
          return
        }
        const originalProduct = products.find((t) => t.id === variables.id)
        toastManager.add({
          title: "Product duplicated",
          description: `${originalProduct?.name} has been duplicated.`,
          type: "success",
        })
        void refetch()
        setDuplicateRedirect({ productId: data.id })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error duplicating product",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const bulkUpdateStatusMutation = useMutation(
    queryApi.products.bulkStatusUpdate.mutationOptions({
      onSuccess: (data, variables) => {
        if (!data) return
        toastManager.add({
          title: "Products updated",
          description: `${data.count} product(s) marked as ${variables.status}.`,
          type: "success",
        })
        setSelectedProductIds([])
        void refetch()
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error updating products",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const handleDeleteClick = useCallback(
    (product: { id: string; name: string }) => {
      setSelectedProduct(product)
      setDeleteDialogOpen(true)
    },
    [],
  )

  const handleConfirmDelete = useCallback(() => {
    if (selectedProduct) {
      deleteProductMutation.mutate({ id: selectedProduct.id })
    }
  }, [selectedProduct, deleteProductMutation])

  const handleToggleAll = useCallback(() => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([])
    } else {
      setSelectedProductIds(products.map((t) => t.id))
    }
  }, [selectedProductIds.length, products])

  const handleToggleProduct = useCallback((productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    )
  }, [])

  const handleBulkUpdateStatus = useCallback(
    (status: "draft" | "active" | "archived") => {
      bulkUpdateStatusMutation.mutate({
        ids: selectedProductIds,
        status,
      })
    },
    [bulkUpdateStatusMutation, selectedProductIds],
  )

  return (
    <>
      {duplicateRedirect && (
        <Navigate to="/products/edit/$productId" params={duplicateRedirect} />
      )}
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage and create AI-powered products for your workflows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedProductIds.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus("active")}
                  disabled={bulkUpdateStatusMutation.isPending}
                >
                  Mark Active ({selectedProductIds.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus("archived")}
                  disabled={bulkUpdateStatusMutation.isPending}
                >
                  Archive ({selectedProductIds.length})
                </Button>
              </>
            )}
            <Link to="/products/add">
              <Button>
                <PlusIcon className="size-4" />
                <span>Create Product</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border">
          <Shimmer loading={isLoading}>
            <ProductsTable
              products={products}
              isLoading={isLoading}
              selectedProductIds={selectedProductIds}
              onToggleAll={handleToggleAll}
              onToggleProduct={handleToggleProduct}
              onDelete={handleDeleteClick}
              duplicateMutation={duplicateProductMutation}
            />
          </Shimmer>
        </div>

        <DeleteProductDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          productName={selectedProduct?.name}
          onConfirm={handleConfirmDelete}
          deleteMutation={deleteProductMutation}
        />
      </div>
    </>
  )
}
