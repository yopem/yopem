import {
  BarChartIcon,
  BotIcon,
  BrainIcon,
  DollarSignIcon,
  HelpCircleIcon,
  KeyIcon,
  PlusCircleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminPageHeader from "@/components/admin/admin-page-header"
import AccessManagementTable from "@/components/admin/settings/access-management-table"
import ApiProviderCard from "@/components/admin/settings/api-provider-card"
import ApiStatsCard from "@/components/admin/settings/api-stats-card"
import { Button } from "@/components/ui/button"

export default function AdminSettingsPage() {
  const breadcrumbItems = [
    { label: "Settings", href: "/dashboard/admin/setting" },
    { label: "API Configuration" },
  ]

  const users = [
    {
      id: "1",
      name: "David Chen",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC03MDeOhoU810hDPn7ScY1hZVCP_Fq_X_Bc95ljrQghnbo5b9E-Ly7yTMerVDlnBB5D8pm-ZXcQ05Bp2oq2_SfnHXRZp4d4Y1-irwMHZEpLUAcLw41VIVJG44GeHjwRFM2pKH1cxLsBlrjUM784xP8dl08ySP7OROnofzgwGINJYT6ojxnhpRMiyQm5GNkbDNUrFmTENiEzx-h4f86-4JbVgfGoYU7kOwULS22wB-FnvX7ea_daTEXvt9wuyV6mMc6QJABq2TnMr4",
      role: "owner" as const,
      permissions: "Full Access",
    },
    {
      id: "2",
      name: "Sarah Miller",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDOk281IWtOILWpcd8lnAawqs9upcktcEdpObjdj1BNgZJxwhXsrTU9jbqu72BUoJjSrqw6CSOJMI7dd1hnqH4vcNwxxpJnmhaOoGrKwyi3E66FzWfYkFdRMly_gf6o1MRwLsAWnrmmgFcCgk4qAGhuEvmCOOHNAPDyEV4jgj9yACPOH4QSoJulPFS5UBN3owyofIHmMgGTufyBHFlxWCfN5yFKOqnKkVijK0Wf8q9q06nUvRJV7xjGPUydQBYbc0ZAQ3-SL5TTktM",
      role: "developer" as const,
      permissions: "Read Only",
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8 pb-24">
          <AdminBreadcrumb items={breadcrumbItems} />

          <AdminPageHeader
            title="API Configuration"
            description="Manage API keys and secrets for your AI providers. Keys are encrypted at rest. Rotate keys periodically for enhanced security."
            action={
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <HelpCircleIcon className="size-4" />
                Documentation
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ApiStatsCard
              title="Total Requests"
              value="1.2M"
              icon={<BarChartIcon />}
              change={{
                value: "+12.5% from last month",
                trend: "up",
                icon: <TrendingUpIcon />,
              }}
            />
            <ApiStatsCard
              title="Active Keys"
              value="4"
              icon={<KeyIcon />}
              change={{
                value: "2 expiring soon",
                trend: "neutral",
              }}
            />
            <ApiStatsCard
              title="Monthly Cost"
              value="$2,405"
              icon={<DollarSignIcon />}
              change={{
                value: "-5% cost efficiency",
                trend: "down",
                icon: <TrendingDownIcon />,
              }}
            />
          </div>

          <div className="flex flex-col gap-8">
            <ApiProviderCard
              name="OpenAI"
              description="Used for GPT-4 and Embeddings"
              icon={<BotIcon className="text-background" />}
              status="active"
              apiKey="sk-proj-**********************"
              lastUsed="Last used 2 minutes ago by System"
            />

            <ApiProviderCard
              name="Anthropic"
              description="Used for Claude 3.5 Sonnet"
              icon={<BrainIcon className="text-background" />}
              status="active"
              apiKey="sk-ant-**********************"
              lastUsed="Last used 4 hours ago by David Chen"
            />

            <button className="border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/50 group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-4 transition-all">
              <PlusCircleIcon className="size-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">Add New Provider</span>
            </button>

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-foreground text-lg font-bold">
                  Key Access Management
                </h2>
                <Button variant="outline" size="sm">
                  Manage Roles
                </Button>
              </div>
              <AccessManagementTable users={users} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-border bg-background/95 sticky bottom-0 flex justify-end gap-3 border-t p-4 backdrop-blur-sm">
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm" className="shadow-sm">
          Save Changes
        </Button>
      </div>
    </div>
  )
}
