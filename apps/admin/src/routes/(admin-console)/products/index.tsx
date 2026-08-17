import { useMutation, useQuery } from "@tanstack/react-query"
import { Navigate, createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import * as v from "valibot"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { toastManager } from "ui/toast"

import type { Product } from "@/features/products/product-actions"

import { DeleteDialog } from "@/components/delete-dialog"
import { ProductsTable } from "@/features/products/products-table"
import { toggleId } from "@/lib/utils/toggle-id"

const productsSearchSchema = v.object({
  page: v.optional(
    v.fallback(
      v.pipe(v.unknown(), v.toNumber(), v.integer(), v.minValue(1)),
      1,
    ),
  ),
})

export const Route = createFileRoute("/(admin-console)/products/")({
  validateSearch: productsSearchSchema,
  component: ProductsRouteComponent,
})

function ProductsRouteComponent() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [duplicateRedirect, setDuplicateRedirect] = useState<{
    productId: string
  } | null>(null)

  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const pageIndex = (search.page ?? 1) - 1
  const pageSize = 20

  const {
    data: productsData,
    isLoading,
    refetch,
  } = useQuery(
    queryApi.products.list.queryOptions({
      input: {
        limit: pageSize,
        offset: pageIndex * pageSize,
        status: "all",
      },
    }),
  )

  const products = useMemo(
    () => (productsData?.products as Product[]) ?? [],
    [productsData],
  )

  const totalPages = Math.max(
    1,
    Math.ceil((productsData?.total ?? 0) / pageSize),
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

  const bulkDeleteProductsMutation = useMutation(
    queryApi.products.bulkDelete.mutationOptions({
      onSuccess: (data) => {
        toastManager.add({
          title: "Products deleted",
          description: `${data.count} product${data.count === 1 ? "" : "s"} deleted.`,
          type: "success",
        })
        setSelectedProductIds([])
        setBulkDeleteDialogOpen(false)
        void refetch()
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error deleting products",
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

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      setSelectedProductIds((prev) => {
        const visibleIds = products.map((t) => t.id)
        if (checked) {
          return Array.from(new Set([...prev, ...visibleIds]))
        }
        return prev.filter((id) => !visibleIds.includes(id))
      })
    },
    [products],
  )

  const handleToggleProduct = useCallback((productId: string) => {
    setSelectedProductIds((prev) => toggleId(prev, productId))
  }, [])

  const bulkActionDisabled =
    bulkUpdateStatusMutation.isPending || bulkDeleteProductsMutation.isPending

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
                  onClick={() => handleBulkUpdateStatus("draft")}
                  disabled={bulkActionDisabled}
                >
                  Mark Draft ({selectedProductIds.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus("active")}
                  disabled={bulkActionDisabled}
                >
                  Mark Active ({selectedProductIds.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus("archived")}
                  disabled={bulkActionDisabled}
                >
                  Archive ({selectedProductIds.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  disabled={bulkActionDisabled}
                >
                  Delete Selected ({selectedProductIds.length})
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
          <ProductsTable
            products={products}
            isLoading={isLoading}
            selectedProductIds={selectedProductIds}
            onToggleAll={handleToggleAll}
            onToggleProduct={handleToggleProduct}
            onDelete={handleDeleteClick}
            duplicateMutation={duplicateProductMutation}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex === 0 || isLoading}
            onClick={() => void navigate({ search: { page: pageIndex } })}
          >
            <ChevronLeftIcon className="size-4" />
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {pageIndex + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex + 1 >= totalPages || isLoading}
            onClick={() => {
              void navigate({ search: { page: pageIndex + 2 } })
            }}
          >
            Next
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Product"
          name={selectedProduct?.name}
          onConfirm={handleConfirmDelete}
          isPending={deleteProductMutation.isPending}
        />

        <DeleteDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          title={`Delete ${selectedProductIds.length} product${selectedProductIds.length === 1 ? "" : "s"}?`}
          description={`Are you sure you want to delete ${selectedProductIds.length} selected product${selectedProductIds.length === 1 ? "" : "s"}? This action cannot be undone.`}
          onConfirm={() =>
            bulkDeleteProductsMutation.mutate({ ids: selectedProductIds })
          }
          isPending={bulkDeleteProductsMutation.isPending}
        />
      </div>
    </>
  )
}
