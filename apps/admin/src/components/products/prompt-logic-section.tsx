"use client"

import type { RefObject } from "react"

import { HelpCircleIcon } from "lucide-react"

import { Card, CardHeader, CardPanel, CardTitle } from "ui/card"
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
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Prompt Logic</h3>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Tell the AI how to behave and what to produce. Click a variable chip
          to insert it into the active text area.
        </p>
      </div>

      <TooltipProvider>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">System Role</CardTitle>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label="What is the system role?"
                      >
                        <HelpCircleIcon className="text-muted-foreground size-4" />
                      </button>
                    }
                  />
                  <TooltipPopup side="top" className="max-w-xs">
                    Sets the AI persona and constraints. Example: “You are a
                    concise copywriter.”
                  </TooltipPopup>
                </Tooltip>
              </div>
            </CardHeader>
            <CardPanel className="flex flex-1 flex-col gap-4 pt-0">
              <Textarea
                ref={systemRoleRef}
                value={systemRole}
                onChange={(e) => onSystemRoleChange?.(e.target.value)}
                placeholder="Define the AI persona..."
                className="font-mono text-sm"
                rows={4}
              />
              {variableList.length > 0 && (
                <VariableChips
                  variables={variableList}
                  onInsert={onInsertSystemRoleVariable}
                />
              )}
            </CardPanel>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  User Instruction Template
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-label="What is the user instruction template?"
                      >
                        <HelpCircleIcon className="text-muted-foreground size-4" />
                      </button>
                    }
                  />
                  <TooltipPopup side="top" className="max-w-xs">
                    The main prompt sent to the model. Use {"{{variable}}"}
                    to insert input values at runtime.
                  </TooltipPopup>
                </Tooltip>
              </div>
            </CardHeader>
            <CardPanel className="flex flex-1 flex-col gap-4 pt-0">
              <Textarea
                ref={userInstructionRef}
                value={userInstructionTemplate}
                onChange={(e) => onUserInstructionChange?.(e.target.value)}
                placeholder="Write your prompt here..."
                className="min-h-48 font-mono text-sm"
                rows={8}
              />
              {variableList.length > 0 && (
                <VariableChips
                  variables={variableList}
                  onInsert={onInsertVariable}
                />
              )}
            </CardPanel>
          </Card>
        </div>
      </TooltipProvider>
    </section>
  )
}

function VariableChips({
  variables,
  onInsert,
}: {
  variables: VariableInfo[]
  onInsert?: (variable: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs">Insert variable:</span>
      {variables.map((variable) => (
        <button
          key={variable.name}
          type="button"
          onClick={() => onInsert?.(variable.name)}
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
  )
}
