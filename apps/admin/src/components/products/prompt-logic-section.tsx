"use client"

import type { RefObject } from "react"

import { HelpCircleIcon, HistoryIcon } from "lucide-react"

import { Button } from "ui/button"
import { Label } from "ui/label"
import { Textarea } from "ui/textarea"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip"

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

export function PromptLogicSection({
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
}: PromptLogicSectionProps) {
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
        <Button variant="ghost" size="xs" onClick={onRestoreVersion} disabled>
          <HistoryIcon className="size-3.5" />
          <span>Restore Version</span>
        </Button>
      </div>
      <TooltipProvider>
        <div className="flex flex-col overflow-hidden rounded-xl border">
          <div className="bg-muted/50 border-border border-b">
            <div className="p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Label htmlFor="system-role">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    System Role
                  </span>
                </Label>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label="What is the system role?"
                      >
                        <HelpCircleIcon className="text-muted-foreground size-3.5" />
                      </button>
                    }
                  />
                  <TooltipPopup side="top" className="max-w-xs">
                    Sets the AI persona and constraints. Example: “You are a
                    concise copywriter.”
                  </TooltipPopup>
                </Tooltip>
              </div>
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
              <div className="bg-muted/30 border-border flex flex-wrap items-center gap-2 border-t px-4 py-2">
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
              <div className="mb-2 flex items-center gap-1.5">
                <Label htmlFor="user-instruction">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    User Instruction Template
                  </span>
                </Label>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label="What is the user instruction template?"
                      >
                        <HelpCircleIcon className="text-muted-foreground size-3.5" />
                      </button>
                    }
                  />
                  <TooltipPopup side="top" className="max-w-xs">
                    The main prompt sent to the model. Use {"{{variable}}"}
                    to insert input values at runtime.
                  </TooltipPopup>
                </Tooltip>
              </div>
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
              <div className="bg-muted/30 border-border flex flex-wrap items-center gap-2 border-t px-4 py-2">
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
      </TooltipProvider>
    </section>
  )
}
