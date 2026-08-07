import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import {
  BotIcon,
  FileImageIcon,
  KeyIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  TagsIcon,
} from "lucide-react"

import { Button } from "ui/button"

import { GlobalBreadcrumb } from "@/components/layout/global-breadcrumb"
import { GlobalPageHeader } from "@/components/layout/global-page-header"
import { QuickStartCard } from "@/features/onboarding/quick-start-card"

export const Route = createFileRoute("/(admin-console)/")({
  component: AdminConsoleComponent,
})

const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Dashboard" }]

function AdminConsoleComponent() {
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <QuickStartCard
          icon={<SparklesIcon className="size-5" />}
          title="Create a product"
          description="Build an AI feature by defining inputs, prompts, and a model."
          action={
            <Button size="sm" render={<Link to="/products/add" />}>
              Get started
            </Button>
          }
        />
        <QuickStartCard
          icon={<BotIcon className="size-5" />}
          title="Manage products"
          description="Edit, preview, duplicate, and publish existing products."
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/products" />}
            >
              View products
            </Button>
          }
        />
        <QuickStartCard
          icon={<TagsIcon className="size-5" />}
          title="Organize categories & tags"
          description="Group products so users can find them easily."
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/categories-tags" />}
            >
              Organize
            </Button>
          }
        />
        <QuickStartCard
          icon={<FileImageIcon className="size-5" />}
          title="Upload assets"
          description="Add thumbnails and media to use across products."
          action={
            <Button variant="outline" size="sm" render={<Link to="/assets" />}>
              Open library
            </Button>
          }
        />
        <QuickStartCard
          icon={<KeyIcon className="size-5" />}
          title="Connect API keys"
          description="Add provider credentials so products can call AI models."
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/settings" />}
            >
              Settings
            </Button>
          }
        />
        <QuickStartCard
          icon={<SettingsIcon className="size-5" />}
          title="Configure the console"
          description="Manage admins, providers, and global preferences."
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/settings" />}
            >
              Settings
            </Button>
          }
        />
      </div>
    </div>
  )
}
