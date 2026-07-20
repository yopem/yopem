import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { HydrateClient } from "rpc/hydration"
import { prefetchQueries } from "rpc/prefetch"
import { queryApi } from "rpc/query"
import { serverQueryApi } from "rpc/server-query"
import { Button } from "ui/button"
import { toastManager } from "ui/toast"

import DeleteDialog from "@/components/products/delete-dialog"
import ProductsTable from "@/components/products/products-table"

interface Product {
  id: string
  name: string
  description: string | null
  status: string
  costPerRun: string | null
  createdAt: Date | null
}

const ProductsIndexPage = () => {
  const { dehydratedState } = Route.useLoaderData()
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    name: string
  } | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const {
    data: productsData,
    isLoading,
    refetch,
  } = useQuery({
    ...queryApi.products.list.queryOptions({
      input: {
        limit: 100,
        status: "all",
      },
    }),
  }) as {
    data:
      | {
          tools: Product[]
          nextCursor: string | undefined
        }
      | undefined
    refetch: () => void
  } & { isLoading: boolean }

  const products = useMemo(() => productsData?.tools ?? [], [productsData])

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await queryApi.products.delete.call({ id })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Product deleted",
        description: `${selectedProduct?.name} has been deleted.`,
        type: "success",
      })
      setDeleteDialogOpen(false)
      setSelectedProduct(null)
      refetch()
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error deleting product",
        description: error.message,
        type: "error",
      })
    },
  })

  const duplicateProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await queryApi.products.duplicate.call({ id })
    },
    onSuccess: (data, variables) => {
      if (!data) {
        toastManager.add({
          title: "Error duplicating product",
          description: "Failed to duplicate product",
          type: "error",
        })
        return
      }
      const originalProduct = products.find((t) => t.id === variables)
      toastManager.add({
        title: "Product duplicated",
        description: `${originalProduct?.name} has been duplicated.`,
        type: "success",
      })
      refetch()
      void navigate({ to: `/products/edit/${data.id}` })
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error duplicating product",
        description: error.message,
        type: "error",
      })
    },
  })

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[]
      status: "draft" | "active" | "archived"
    }) => {
      return await queryApi.products.bulkUpdateStatus.call({
        ids,
        status,
      })
    },
    onSuccess: (data, variables) => {
      if (!data) return
      toastManager.add({
        title: "Products updated",
        description: `${data.count} product(s) marked as ${variables.status}.`,
        type: "success",
      })
      setSelectedProductIds([])
      refetch()
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error updating products",
        description: error.message,
        type: "error",
      })
    },
  })

  const handleDeleteClick = useCallback(
    (product: { id: string; name: string }) => {
      setSelectedProduct(product)
      setDeleteDialogOpen(true)
    },
    [],
  )

  const handleConfirmDelete = useCallback(() => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id)
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
    <HydrateClient state={dehydratedState}>
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

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          productName={selectedProduct?.name}
          onConfirm={handleConfirmDelete}
          deleteMutation={deleteProductMutation}
        />
      </div>
    </HydrateClient>
  )
}

export const Route = createFileRoute("/_dashboard/products/")({
  loader: async ({ context }) => {
    const dehydratedState = await prefetchQueries(context.queryClient, [
      serverQueryApi.products.list.queryOptions({
        input: { limit: 100, status: "all" },
      }),
    ])
    return { dehydratedState }
  },
  component: ProductsIndexPage,
})
