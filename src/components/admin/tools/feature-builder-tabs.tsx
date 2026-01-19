"use client"

import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs"

interface FeatureBuilderTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "builder", label: "Builder" },
  { id: "history", label: "History" },
  { id: "api", label: "API Integration" },
]

const FeatureBuilderTabs = ({
  activeTab,
  onTabChange,
}: FeatureBuilderTabsProps) => {
  return (
    <div className="border-b">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList variant="underline" className="gap-8 p-0">
          {tabs.map((tab) => (
            <TabsTab key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

export default FeatureBuilderTabs
