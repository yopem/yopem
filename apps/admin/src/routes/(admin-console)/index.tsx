import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "ui/button"

import { GlobalBreadcrumb } from "@/components/layout/global-breadcrumb"
import { GlobalPageHeader } from "@/components/layout/global-page-header"

export const Route = createFileRoute("/(admin-console)/")({
  component: AdminConsoleComponent,
})

function AdminConsoleComponent() {
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Dashboard" }]

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <GlobalBreadcrumb items={breadcrumbItems} />
      <GlobalPageHeader
        title="Overview"
        description="Welcome back, Admin. System status is operational."
        action={
          <Button render={<Link to="/products/add" />}>
            <PlusIcon className="size-4.5" />
            <span>Add New Product</span>
          </Button>
        }
      />
    </div>
  )
}
