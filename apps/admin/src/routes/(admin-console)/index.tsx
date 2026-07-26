import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "ui/button"

import GlobalBreadcrumb from "@/components/layout/global-breadcrumb"
import GlobalPageHeader from "@/components/layout/global-page-header"

const AdminConsolePage = () => {
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Dashboard" }]

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <GlobalBreadcrumb items={breadcrumbItems} />
      <GlobalPageHeader
        title="Overview"
        description="Welcome back, Admin. System status is operational."
        action={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold tracking-tight shadow-sm transition-colors"
            render={
              <>
                {/* @ts-ignore */}
                <Link to="/products/add">
                  <PlusIcon className="size-4.5" />
                  <span>Add New Product</span>
                </Link>
              </>
            }
          />
        }
      />
    </div>
  )
}

export const Route = createFileRoute("/(admin-console)/")({
  component: AdminConsolePage,
})
