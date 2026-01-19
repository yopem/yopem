"use client"

import { Plus as PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import InputSchemaRow, { type InputFieldType } from "./input-schema-row"

interface InputSchemaField {
  id: string
  variableName: string
  type: InputFieldType
  description: string
}

interface InputSchemaSectionProps {
  fields: InputSchemaField[]
  onAddField?: () => void
  onUpdateField?: (
    id: string,
    updates: Partial<Omit<InputSchemaField, "id">>,
  ) => void
  onDeleteField?: (id: string) => void
}

const InputSchemaSection = ({
  fields,
  onAddField,
  onUpdateField,
  onDeleteField,
}: InputSchemaSectionProps) => {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Input Schema</h3>
        </div>
        <Button variant="outline" size="xs" onClick={onAddField}>
          <PlusIcon className="size-3.5" />
          <span>Add Field</span>
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <div className="bg-muted/50 text-muted-foreground grid grid-cols-12 gap-4 border-b p-4 text-xs font-semibold tracking-wider uppercase">
          <div className="col-span-4">Variable Name</div>
          <div className="col-span-3">Type</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        {fields.map((field) => (
          <InputSchemaRow
            key={`${field.id}-${field.variableName}-${field.description}`}
            variableName={field.variableName}
            type={field.type}
            description={field.description}
            onVariableNameChange={(value) =>
              onUpdateField?.(field.id, { variableName: value })
            }
            onTypeChange={(value) => onUpdateField?.(field.id, { type: value })}
            onDescriptionChange={(value) =>
              onUpdateField?.(field.id, { description: value })
            }
            onDelete={() => onDeleteField?.(field.id)}
          />
        ))}
      </div>
    </section>
  )
}

export default InputSchemaSection
