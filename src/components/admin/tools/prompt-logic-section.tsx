"use client"

import { History as HistoryIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PromptLogicSectionProps {
  systemRole: string
  userInstructionTemplate: string
  variableNames?: string[]
  onSystemRoleChange?: (value: string) => void
  onUserInstructionChange?: (value: string) => void
  onInsertVariable?: (variable: string) => void
  onRestoreVersion?: () => void
}

const PromptLogicSection = ({
  systemRole,
  userInstructionTemplate,
  variableNames = [],
  onSystemRoleChange,
  onUserInstructionChange,
  onInsertVariable,
  onRestoreVersion,
}: PromptLogicSectionProps) => {
  return (
    <section className="flex flex-col gap-4 pb-12">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Prompt Logic</h3>
        <Button variant="ghost" size="xs" onClick={onRestoreVersion}>
          <HistoryIcon className="size-3.5" />
          <span>Restore Version</span>
        </Button>
      </div>
      <div className="flex flex-col overflow-hidden rounded-xl border">
        <div className="bg-muted/50 border-b p-4">
          <label className="text-muted-foreground mb-2 block text-xs font-bold tracking-wider uppercase">
            System Role
          </label>
          <Textarea
            value={systemRole}
            onChange={(e) => onSystemRoleChange?.(e.target.value)}
            placeholder="Define the AI persona..."
            className="font-mono text-sm"
            rows={2}
            unstyled
          />
        </div>
        <div className="bg-background relative flex flex-col p-4">
          <label className="text-muted-foreground mb-2 block text-xs font-bold tracking-wider uppercase">
            User Instruction Template
          </label>
          <Textarea
            value={userInstructionTemplate}
            onChange={(e) => onUserInstructionChange?.(e.target.value)}
            placeholder="Write your prompt here..."
            className="h-full min-h-[150px] font-mono text-sm"
            unstyled
          />
          {variableNames.length > 0 && (
            <div className="absolute right-4 bottom-4 flex gap-2">
              {variableNames.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => onInsertVariable?.(variable)}
                  className="bg-muted text-muted-foreground hover:bg-muted/80 rounded border px-2 py-1 font-mono text-xs transition-colors"
                >
                  + {variable}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default PromptLogicSection
