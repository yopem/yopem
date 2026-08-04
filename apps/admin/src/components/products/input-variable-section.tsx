"use client"

import { InboxIcon, PlusIcon, Wand2Icon } from "lucide-react"

import { Button } from "ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card"

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
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Input Variables</h3>
        </div>
        <Button variant="outline" size="xs" onClick={() => onAddField?.()}>
          <PlusIcon className="size-3.5" />
          <span>Add Field</span>
        </Button>
      </div>
      {fields.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center py-10 text-center">
            <InboxIcon className="text-muted-foreground/60 mb-3 size-8" />
            <CardTitle className="text-base">No input variables yet</CardTitle>
            <CardDescription className="max-w-xs">
              Input variables are the fields users fill out before running your
              product.
            </CardDescription>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" onClick={() => onAddField?.()}>
                <PlusIcon className="size-4" />
                Add your first variable
              </Button>
              <Button variant="ghost" size="sm" onClick={handleAddExample}>
                <Wand2Icon className="size-4" />
                Use example
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="bg-muted/50 text-muted-foreground border-border grid grid-cols-12 gap-4 border-b p-4 text-xs font-semibold tracking-wider uppercase">
            <div className="col-span-3">Variable Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-3">Options</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
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
