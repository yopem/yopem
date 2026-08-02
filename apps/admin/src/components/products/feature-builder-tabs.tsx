"use client"

import { Tabs, TabsList, TabsTab } from "ui/tabs"

interface FeatureBuilderTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  disabledTabs?: string[]
}

const tabs = [
  { id: "builder", label: "Builder" },
  { id: "description", label: "Description" },
  { id: "history", label: "History" },
  { id: "api", label: "API Integration" },
]

export function FeatureBuilderTabs({
  activeTab,
  onTabChange,
  disabledTabs = [],
}: FeatureBuilderTabsProps) {
  return (
    <div className="border-border border-b">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList variant="underline" className="gap-8 p-0">
          {tabs.map((tab) => {
            const isDisabled = disabledTabs.includes(tab.id)
            return (
              <TabsTab
                key={tab.id}
                value={tab.id}
                disabled={isDisabled}
                className={
                  isDisabled
                    ? "text-muted-foreground/40 pointer-events-none cursor-not-allowed"
                    : undefined
                }
              >
                {tab.label}
              </TabsTab>
            )
          })}
        </TabsList>
      </Tabs>
    </div>
  )
}
