"use client"

import { InboxIcon, PlusIcon, Wand2Icon } from "lucide-react"

import { Button } from "ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "ui/empty"

import {
  InputVariableRow,
  type InputFieldType,
  type SelectOption,
} from "./input-variable-row"

interface InputVariableField {
  id: string
  variableName: string
  type: InputFieldType
  description: string
  options?: SelectOption[]
  isOptional?: boolean
}

interface InputVariableSectionProps {
  fields: InputVariableField[]
  onAddField?: (initial?: Partial<Omit<InputVariableField, "id">>) => void
  onUpdateField?: (
    id: string,
    updates: Partial<Omit<InputVariableField, "id">>,
  ) => void
  onDeleteField?: (id: string) => void
}

export function InputVariableSection({
  fields,
  onAddField,
  onUpdateField,
  onDeleteField,
}: InputVariableSectionProps) {
  const handleAddExample = () => {
    onAddField?.({
      variableName: "topic",
      type: "text",
      description: "What the user wants to generate content about",
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Input Variables</h3>
          <p className="text-muted-foreground max-w-xl text-sm">
            These are the fields users fill out before running your product.
            Start with one simple variable.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onAddField?.()}>
          <PlusIcon className="size-4" />
          <span>Add Field</span>
        </Button>
      </div>

      {fields.length === 0 ? (
        <Empty className="border-border rounded-2xl border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>No input variables yet</EmptyTitle>
            <EmptyDescription>
              Input variables are the fields users fill out before running your
              product.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row">
            <Button size="sm" onClick={() => onAddField?.()}>
              <PlusIcon className="size-4" />
              Add your first variable
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAddExample}>
              <Wand2Icon className="size-4" />
              Use example
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4">
          {fields.map((field) => (
            <InputVariableRow
              key={field.id}
              variableName={field.variableName}
              type={field.type}
              description={field.description}
              options={field.options}
              isOptional={field.isOptional}
              onVariableNameChange={(value) =>
                onUpdateField?.(field.id, { variableName: value })
              }
              onTypeChange={(value) =>
                onUpdateField?.(field.id, { type: value })
              }
              onDescriptionChange={(value) =>
                onUpdateField?.(field.id, { description: value })
              }
              onOptionsChange={(value) =>
                onUpdateField?.(field.id, { options: value })
              }
              onOptionalChange={(value) =>
                onUpdateField?.(field.id, { isOptional: value })
              }
              onDelete={() => onDeleteField?.(field.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
