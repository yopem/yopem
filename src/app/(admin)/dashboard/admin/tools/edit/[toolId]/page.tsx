"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  LoaderCircle as LoaderCircleIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
} from "lucide-react"
import { z } from "zod"

import FeatureBuilderHeader from "@/components/admin/tools/feature-builder-header"
import FeatureBuilderTabs from "@/components/admin/tools/feature-builder-tabs"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { Toggle } from "@/components/ui/toggle"
import { updateToolSchema } from "@/lib/db/schema"
import { queryApi } from "@/lib/orpc/query"

type InputFieldType = "text" | "select"

const modelOptions = [
  "GPT-4 Turbo",
  "GPT-3.5 Turbo",
  "Claude 3 Opus",
  "Mistral Large",
]

const toolFormSchema = updateToolSchema
  .pick({
    name: true,
    description: true,
    systemRole: true,
    userInstructionTemplate: true,
    inputSchema: true,
    outputFormat: true,
    costPerRun: true,
    config: true,
  })
  .extend({
    name: z.string().min(1, "Tool name is required").trim(),
    description: z.string().min(1, "Tool description is required").trim(),
    systemRole: z.string().min(1, "System role is required").trim(),
    userInstructionTemplate: z
      .string()
      .min(1, "User instruction template is required")
      .trim(),
    inputSchema: z
      .array(
        z.object({
          variableName: z.string().min(1),
          type: z.enum(["text", "select"]),
          description: z.string(),
        }),
      )
      .min(1, "At least one input field is required"),
  })

function EditToolPage() {
  const params = useParams()
  const toolId = params["toolId"] as string
  const [activeTab, setActiveTab] = useState("builder")
  const [testSheetOpen, setTestSheetOpen] = useState(false)
  const [testInputs, setTestInputs] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<string | null>(null)

  const {
    data: tool,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tools", toolId],
    queryFn: async () => {
      return await queryApi.tools.getById.call({ id: toolId })
    },
  })

  const updateToolMutation = useMutation({
    mutationFn: async (data: z.infer<typeof toolFormSchema>) => {
      await queryApi.tools.update.call({
        id: toolId,
        ...data,
      })
    },
    onSuccess: (_, variables) => {
      toastManager.add({
        title: "Tool updated successfully!",
        description: `${variables.name} has been updated.`,
        type: "success",
      })
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Error updating tool",
        description: err.message,
        type: "error",
      })
    },
  })

  const executeToolMutation = useMutation({
    mutationFn: async (inputs: Record<string, unknown>) => {
      return await queryApi.tools.execute.call({
        toolId,
        inputs,
      })
    },
    onSuccess: (data) => {
      setTestResult(data.output)
      toastManager.add({
        title: "Test completed",
        description: `Tool executed successfully. Cost: ${data.cost} credits`,
        type: "success",
      })
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Test execution failed",
        description: err.message,
        type: "error",
      })
    },
  })

  const handleTestRun = () => {
    if (!tool?.inputSchema || !Array.isArray(tool.inputSchema)) return
    const initialInputs: Record<string, string> = {}
    tool.inputSchema.forEach((field: { variableName: string }) => {
      initialInputs[field.variableName] = ""
    })
    setTestInputs(initialInputs)
    setTestResult(null)
    setTestSheetOpen(true)
  }

  const handleExecuteTest = () => {
    executeToolMutation.mutate(testInputs)
  }

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      inputFields: [] as {
        id: string
        variableName: string
        type: "text" | "select"
        description: string
      }[],
      systemRole: "",
      userInstructionTemplate: "",
      modelEngine: modelOptions[0],
      temperature: 0.7,
      maxTokens: 2048,
      outputFormat: "plain" as "plain" | "json",
      costPerRun: 0.05,
    },
    onSubmit: ({ value }) => {
      const formData = {
        name: value.name,
        description: value.description,
        systemRole: value.systemRole,
        userInstructionTemplate: value.userInstructionTemplate,
        inputSchema: value.inputFields.map((field) => ({
          variableName: field.variableName,
          type: field.type,
          description: field.description,
        })),
        outputFormat: value.outputFormat,
        costPerRun: String(value.costPerRun),
        config: {
          modelEngine: value.modelEngine,
          temperature: value.temperature,
          maxTokens: value.maxTokens,
        },
      }

      const result = toolFormSchema.safeParse(formData)

      if (!result.success) {
        const firstError = result.error.issues[0]
        toastManager.add({
          title: "Validation Error",
          description: firstError.message,
          type: "error",
        })
        return
      }

      updateToolMutation.mutate(formData)
    },
  })

  useEffect(() => {
    if (tool) {
      form.setFieldValue("name", tool.name)
      form.setFieldValue("description", tool.description ?? "")
      form.setFieldValue("systemRole", tool.systemRole ?? "")
      form.setFieldValue(
        "userInstructionTemplate",
        tool.userInstructionTemplate ?? "",
      )

      if (tool.inputSchema && Array.isArray(tool.inputSchema)) {
        form.setFieldValue(
          "inputFields",
          (
            tool.inputSchema as {
              variableName: string
              type: "text" | "select"
              description: string
            }[]
          ).map((field, index) => ({
            id: String(index + 1),
            ...field,
          })),
        )
      }

      if (tool.config && typeof tool.config === "object") {
        const config = tool.config as {
          modelEngine?: string
          temperature?: number
          maxTokens?: number
        }
        if (config.modelEngine)
          form.setFieldValue("modelEngine", config.modelEngine)
        if (config.temperature !== undefined)
          form.setFieldValue("temperature", config.temperature)
        if (config.maxTokens !== undefined)
          form.setFieldValue("maxTokens", config.maxTokens)
      }

      if (tool.outputFormat) {
        form.setFieldValue("outputFormat", tool.outputFormat)
      }

      if (tool.costPerRun) {
        form.setFieldValue("costPerRun", Number(tool.costPerRun))
      }
    }
  }, [tool, form])

  const handleInsertVariable = (variable: string) => {
    form.setFieldValue(
      "userInstructionTemplate",
      `${form.getFieldValue("userInstructionTemplate")}\n{{${variable}}}`,
    )
  }

  const handleSave = () => {
    void form.handleSubmit()
  }

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/dashboard/admin/tools" },
          { label: form.getFieldValue("name") || "Edit Tool" },
        ]}
        status="Draft"
        onTestRun={handleTestRun}
        onSave={handleSave}
        isSaving={updateToolMutation.isPending}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Configure Feature Workflow
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Define the input variables, structure your prompt logic, and
              configure the AI model behavior for this feature.
            </p>
          </div>

          {isLoading ? (
            <div className="text-muted-foreground">Loading tool data...</div>
          ) : error ? (
            <div className="text-destructive">
              Error loading tool: {error.message}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <form.Field name="name">
                  {(field) => (
                    <Field>
                      <FieldLabel>Tool Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter tool name"
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="description">
                  {(field) => (
                    <Field>
                      <FieldLabel>Tool Description</FieldLabel>
                      <Textarea
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter tool description"
                        rows={3}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>

              <Separator />

              <FeatureBuilderTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              {activeTab === "builder" && (
                <>
                  <form.Field name="inputFields" mode="array">
                    {(field) => {
                      const handleAddFieldInternal = () => {
                        const newId = String(Date.now())
                        field.pushValue({
                          id: newId,
                          variableName: "",
                          type: "text" as const,
                          description: "",
                        })
                      }

                      const handleDeleteFieldInternal = (index: number) => {
                        field.removeValue(index)
                      }

                      return (
                        <section className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                Input Schema
                              </h3>
                            </div>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={handleAddFieldInternal}
                            >
                              <PlusIcon className="size-3.5" />
                              <span>Add Field</span>
                            </Button>
                          </div>
                          <div className="overflow-hidden rounded-xl border">
                            <div className="bg-muted/50 text-muted-foreground grid grid-cols-12 gap-4 border-b p-4 text-xs font-semibold tracking-wider uppercase">
                              <div className="col-span-4">Variable Name</div>
                              <div className="col-span-3">Type</div>
                              <div className="col-span-4">Description</div>
                              <div className="col-span-1 text-right">
                                Actions
                              </div>
                            </div>
                            {field.state.value.map((_, index) => (
                              <div
                                key={field.state.value[index]?.id ?? index}
                                className="group hover:bg-muted/50 grid grid-cols-12 items-center gap-4 border-b p-4 transition-colors"
                              >
                                <div className="col-span-4">
                                  <form.Field
                                    name={`inputFields[${index}].variableName`}
                                  >
                                    {(subField) => (
                                      <Input
                                        value={subField.state.value}
                                        onChange={(e) =>
                                          subField.handleChange(
                                            e.currentTarget.value,
                                          )
                                        }
                                        placeholder="variable_name"
                                        className="font-mono text-sm"
                                      />
                                    )}
                                  </form.Field>
                                </div>
                                <div className="col-span-3">
                                  <form.Field
                                    name={`inputFields[${index}].type`}
                                  >
                                    {(subField) => (
                                      <Select
                                        value={subField.state.value}
                                        onValueChange={(
                                          value: string[] | string | null,
                                        ) => {
                                          if (
                                            value &&
                                            typeof value === "string"
                                          ) {
                                            subField.handleChange(
                                              value as InputFieldType,
                                            )
                                          } else if (
                                            Array.isArray(value) &&
                                            value.length > 0
                                          ) {
                                            subField.handleChange(
                                              value[0] as InputFieldType,
                                            )
                                          }
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectPopup>
                                          <SelectItem value="text">
                                            Text String
                                          </SelectItem>
                                          <SelectItem value="select">
                                            Select Option
                                          </SelectItem>
                                        </SelectPopup>
                                      </Select>
                                    )}
                                  </form.Field>
                                </div>
                                <div className="col-span-4">
                                  <form.Field
                                    name={`inputFields[${index}].description`}
                                  >
                                    {(subField) => (
                                      <Input
                                        value={subField.state.value}
                                        onChange={(e) =>
                                          subField.handleChange(
                                            e.currentTarget.value,
                                          )
                                        }
                                        placeholder="Field description"
                                        className="text-sm"
                                      />
                                    )}
                                  </form.Field>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  <button
                                    onClick={() =>
                                      handleDeleteFieldInternal(index)
                                    }
                                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1 transition-colors"
                                  >
                                    <Trash2Icon className="size-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )
                    }}
                  </form.Field>
                  <Separator />
                  <section className="flex flex-col gap-4 pb-12">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Prompt Logic</h3>
                    </div>
                    <div className="flex flex-col overflow-hidden rounded-xl border">
                      <div className="bg-muted/50 border-b p-4">
                        <label className="text-muted-foreground mb-2 block text-xs font-bold tracking-wider uppercase">
                          System Role
                        </label>
                        <form.Field name="systemRole">
                          {(field) => (
                            <Textarea
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              placeholder="Define the AI persona..."
                              className="font-mono text-sm"
                              rows={2}
                              unstyled
                            />
                          )}
                        </form.Field>
                      </div>
                      <div className="bg-background relative flex flex-col p-4">
                        <label className="text-muted-foreground mb-2 block text-xs font-bold tracking-wider uppercase">
                          User Instruction Template
                        </label>
                        <form.Field name="userInstructionTemplate">
                          {(field) => (
                            <Textarea
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              placeholder="Write your prompt here..."
                              className="h-full min-h-[150px] font-mono text-sm"
                              unstyled
                            />
                          )}
                        </form.Field>
                        <form.Field name="inputFields" mode="array">
                          {(field) => {
                            const variablesWithNames = field.state.value.filter(
                              (f) =>
                                f.variableName && f.variableName.trim() !== "",
                            )
                            return variablesWithNames.length > 0 ? (
                              <div className="absolute right-4 bottom-4 flex flex-wrap gap-2">
                                {variablesWithNames.map((inputField) => (
                                  <button
                                    key={inputField.id}
                                    type="button"
                                    onClick={() =>
                                      handleInsertVariable(
                                        inputField.variableName,
                                      )
                                    }
                                    className="bg-muted text-muted-foreground hover:bg-muted/80 rounded border px-2 py-1 font-mono text-xs transition-colors"
                                  >
                                    + {inputField.variableName}
                                  </button>
                                ))}
                              </div>
                            ) : null
                          }}
                        </form.Field>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
        <aside className="bg-muted/30 w-80 border-l p-6">
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-semibold">Configuration</h3>
            <form.Field name="modelEngine">
              {(field) => (
                <Field>
                  <FieldLabel>Model Engine</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => {
                      if (typeof v === "string") {
                        field.handleChange(v)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {modelOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
              )}
            </form.Field>
            <form.Field name="temperature">
              {(field) => (
                <Field>
                  <FieldLabel>
                    Temperature {field.state.value.toFixed(1)}
                  </FieldLabel>
                  <Slider
                    value={[field.state.value]}
                    onValueChange={(value) => {
                      if (Array.isArray(value)) {
                        field.handleChange(value[0] ?? 0.7)
                      }
                    }}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="maxTokens">
              {(field) => (
                <Field>
                  <FieldLabel>Max Tokens {field.state.value}</FieldLabel>
                  <Slider
                    value={[field.state.value]}
                    onValueChange={(value) => {
                      if (Array.isArray(value)) {
                        field.handleChange(value[0] ?? 2048)
                      }
                    }}
                    min={100}
                    max={4096}
                    step={100}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="outputFormat">
              {(field) => (
                <Field>
                  <FieldLabel>Output Format</FieldLabel>
                  <p className="text-muted-foreground mb-2 text-xs">
                    Forces the model to output valid JSON
                  </p>
                  <div className="flex gap-2">
                    <Toggle
                      pressed={field.state.value === "plain"}
                      onPressedChange={(pressed) => {
                        if (pressed) field.handleChange("plain")
                      }}
                    >
                      Plain Text
                    </Toggle>
                    <Toggle
                      pressed={field.state.value === "json"}
                      onPressedChange={(pressed) => {
                        if (pressed) field.handleChange("json")
                      }}
                    >
                      JSON Object
                    </Toggle>
                  </div>
                </Field>
              )}
            </form.Field>
            <form.Field name="costPerRun">
              {(field) => (
                <Field>
                  <FieldLabel>Usage Pricing</FieldLabel>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        Cost per run
                      </span>
                      <span className="text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseFloat(e.target.value) || 0)
                        }
                        step="0.01"
                        min="0"
                        className="bg-background border-input ring-ring/24 w-20 rounded border px-2 py-1 text-sm outline-none focus:ring-2"
                      />
                    </div>
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>Markup</span>
                      <span>+20%</span>
                    </div>
                  </div>
                </Field>
              )}
            </form.Field>
          </div>
        </aside>
      </div>

      <Sheet open={testSheetOpen} onOpenChange={setTestSheetOpen}>
        <SheetPopup side="right">
          <SheetPanel>
            <SheetHeader>
              <SheetTitle>Test Tool Execution</SheetTitle>
              <SheetDescription>
                Test your tool with sample inputs before deploying.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 p-6">
              <>
                {tool?.inputSchema &&
                  Array.isArray(tool.inputSchema) &&
                  tool.inputSchema.length > 0 && (
                    <div className="flex flex-col gap-4">
                      {(
                        tool.inputSchema as {
                          variableName: string
                          description: string
                          type: string
                        }[]
                      ).map((field) => (
                        <Field key={field.variableName}>
                          <FieldLabel>{field.variableName}</FieldLabel>
                          <Input
                            value={testInputs[field.variableName] || ""}
                            onChange={(e) =>
                              setTestInputs((prev) => ({
                                ...prev,
                                [field.variableName]: e.target.value,
                              }))
                            }
                            placeholder={field.description}
                          />
                        </Field>
                      ))}
                    </div>
                  )}
              </>

              <Button
                onClick={handleExecuteTest}
                disabled={executeToolMutation.isPending}
              >
                {executeToolMutation.isPending ? (
                  <>
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  "Execute Test"
                )}
              </Button>

              {testResult && (
                <div className="bg-muted mt-4 rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Result:</h4>
                  <pre className="text-sm whitespace-pre-wrap">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          </SheetPanel>
        </SheetPopup>
      </Sheet>
    </>
  )
}

export default EditToolPage
