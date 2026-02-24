"use client"

import type { RefObject } from "react"

import { Button } from "@repo/ui/button"
import { Label } from "@repo/ui/label"
import { Textarea } from "@repo/ui/textarea"
import { HistoryIcon } from "lucide-react"

interface VariableInfo {
  name: string
  isOptional?: boolean
}

interface PromptLogicSectionProps {
  systemRole: string
  userInstructionTemplate: string
  variableNames?: string[]
  variables?: VariableInfo[]
  onSystemRoleChange?: (value: string) => void
  onUserInstructionChange?: (value: string) => void
  onInsertVariable?: (variable: string) => void
  onInsertSystemRoleVariable?: (variable: string) => void
  onRestoreVersion?: () => void
  systemRoleRef?: RefObject<HTMLTextAreaElement | null>
  userInstructionRef?: RefObject<HTMLTextAreaElement | null>
}

const EMPTY_VARIABLE_NAMES: string[] = []
const EMPTY_VARIABLES: VariableInfo[] = []

const PromptLogicSection = ({
  systemRole,
  userInstructionTemplate,
  variableNames,
  variables,
  onSystemRoleChange,
  onUserInstructionChange,
  onInsertVariable,
  onInsertSystemRoleVariable,
  onRestoreVersion,
  systemRoleRef,
  userInstructionRef,
}: PromptLogicSectionProps) => {
  const safeVariableNames = variableNames ?? EMPTY_VARIABLE_NAMES
  const safeVariables = variables ?? EMPTY_VARIABLES
  const variableList =
    safeVariables.length > 0
      ? safeVariables
      : safeVariableNames.map((name) => ({ name, isOptional: false }))
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
        <div className="bg-muted/50 border-b">
          <div className="p-4">
            <Label
              htmlFor="system-role"
              className="text-muted-foreground mb-2 block text-xs font-bold tracking-wider uppercase"
            >
              System Role
            </Label>
            <Textarea
              id="system-role"
              ref={systemRoleRef}
              value={systemRole}
              onChange={(e) => onSystemRoleChange?.(e.target.value)}
              placeholder="Define the AI persona..."
              className="font-mono text-sm"
              rows={2}
              unstyled
            />
          </div>
          {variableList.length > 0 && (
            <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-t px-4 py-2">
              <span className="text-muted-foreground text-xs">
                Insert variable:
              </span>
              {variableList.map((variable) => (
                <button
                  key={variable.name}
                  type="button"
                  onClick={() => onInsertSystemRoleVariable?.(variable.name)}
                  className={`rounded-sm border px-2 py-1 font-mono text-xs transition-colors ${
                    variable.isOptional
                      ? `bg-muted/50 text-muted-foreground hover:bg-muted border-dashed`
                      : `bg-background hover:bg-muted`
                  }`}
                >
                  + {variable.name}
                  {variable.isOptional && (
                    <span className="ml-1 text-[10px] opacity-60">?</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-background flex flex-col">
          <div className="p-4">
            <Label
              htmlFor="user-instruction"
              className="text-muted-foreground mb-2 block text-xs font-bold tracking-wider uppercase"
            >
              User Instruction Template
            </Label>
            <Textarea
              id="user-instruction"
              ref={userInstructionRef}
              value={userInstructionTemplate}
              onChange={(e) => onUserInstructionChange?.(e.target.value)}
              placeholder="Write your prompt here..."
              className="h-full min-h-37.5 font-mono text-sm"
              unstyled
            />
          </div>
          {variableList.length > 0 && (
            <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-t px-4 py-2">
              <span className="text-muted-foreground text-xs">
                Insert variable:
              </span>
              {variableList.map((variable) => (
                <button
                  key={variable.name}
                  type="button"
                  onClick={() => onInsertVariable?.(variable.name)}
                  className={`rounded-sm border px-2 py-1 font-mono text-xs transition-colors ${
                    variable.isOptional
                      ? `bg-muted/50 text-muted-foreground hover:bg-muted border-dashed`
                      : `bg-background hover:bg-muted`
                  }`}
                >
                  + {variable.name}
                  {variable.isOptional && (
                    <span className="ml-1 text-[10px] opacity-60">?</span>
                  )}
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
