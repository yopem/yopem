"use client"

import {
  addEdge,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import "./workflow-editor.css"
import {
  BotIcon,
  GitBranchIcon,
  InboxIcon,
  LayoutTemplateIcon,
  PlusIcon,
  RepeatIcon,
  Trash2Icon,
  VariableIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { ProductWorkflow, WorkflowNode } from "db/schema"
import { Button } from "ui/button"
import { Card, CardPanel } from "ui/card"
import { Checkbox } from "ui/checkbox"
import { Field, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { ScrollArea } from "ui/scroll-area"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"
import { Textarea } from "ui/textarea"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip"
import type { ApiKeyConfig } from "utils/api-input"

const nodeTypeClasses: Record<WorkflowNode["type"], string> = {
  input: "border-l-4 border-l-yellow-400",
  ai: "border-l-4 border-l-blue-400",
  output: "border-l-4 border-l-green-400",
  condition: "border-l-4 border-l-purple-400",
  loop: "border-l-4 border-l-orange-400",
}

const nodeTypeLabels: Record<WorkflowNode["type"], string> = {
  input: "Input",
  ai: "AI Prompt",
  output: "Output",
  condition: "Condition",
  loop: "Loop",
}

const nodeTypeIcons: Record<WorkflowNode["type"], React.ElementType> = {
  input: InboxIcon,
  ai: BotIcon,
  output: LayoutTemplateIcon,
  condition: GitBranchIcon,
  loop: RepeatIcon,
}

export interface WorkflowEditorProps {
  workflow: ProductWorkflow
  apiKeys: ApiKeyConfig[]
  availableModels: string[]
  defaultApiKeyId?: string
  onChange: (workflow: ProductWorkflow) => void
}

export function WorkflowEditor({
  workflow,
  apiKeys,
  availableModels,
  defaultApiKeyId,
  onChange,
}: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(workflow))
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  useEffect(() => {
    setNodes(toFlowNodes(workflow))
    setEdges(workflow.edges)
  }, [workflow])

  const emit = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      const typedNodes = nextNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })) as ProductWorkflow["nodes"]
      onChange({
        nodes: typedNodes,
        edges: nextEdges as ProductWorkflow["edges"],
      })
    },
    [onChange],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(connection, edges)
      setEdges(newEdges)
      emit(nodes, newEdges)
    },
    [edges, nodes, emit, setEdges],
  )

  const addNode = useCallback(
    (type: WorkflowNode["type"]) => {
      const id = `${type}_${Date.now()}`
      const baseY = 100 + nodes.length * 80
      const baseX = type === "input" ? 50 : type === "output" ? 650 : 350
      const newNode: Node = {
        id,
        type,
        position: { x: baseX, y: baseY },
        data: defaultNodeData(type, defaultApiKeyId),
      }
      const nextNodes = [...nodes, newNode]
      setNodes(nextNodes)
      emit(nextNodes, edges)
      setSelectedNodeId(id)
    },
    [nodes, edges, emit, defaultApiKeyId, setNodes],
  )

  const updateNodeData = useCallback(
    (id: string, data: Partial<WorkflowNode["data"]>) => {
      const nextNodes = nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
      )
      setNodes(nextNodes)
      emit(nextNodes, edges)
    },
    [nodes, edges, emit, setNodes],
  )

  const deleteNode = useCallback(
    (id: string) => {
      const nextNodes = nodes.filter((n) => n.id !== id)
      const nextEdges = edges.filter((e) => e.source !== id && e.target !== id)
      setNodes(nextNodes)
      setEdges(nextEdges)
      emit(nextNodes, nextEdges)
      if (selectedNodeId === id) setSelectedNodeId(null)
    },
    [nodes, edges, emit, selectedNodeId, setNodes, setEdges],
  )

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Workflow</h3>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Drag nodes to arrange them. Connect handles to wire steps together.
            Select a node to edit its settings.
          </p>
        </div>
        <NodeToolbar onAdd={addNode} />
      </div>

      <div className="border-border flex flex-col overflow-hidden rounded-lg border lg:h-[40rem] lg:flex-row">
        <div className="h-72 lg:h-auto lg:min-h-0 lg:flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, n) => setSelectedNodeId(n.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        <div className="border-border flex w-full flex-col lg:h-full lg:w-80 lg:border-t-0 lg:border-l">
          <ScrollArea className="h-full">
            {selectedNode ? (
              <NodeEditorPanel
                node={selectedNode}
                apiKeys={apiKeys}
                availableModels={availableModels}
                onChange={(data) => updateNodeData(selectedNode.id, data)}
                onDelete={() => deleteNode(selectedNode.id)}
              />
            ) : (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm">
                <VariableIcon className="size-8 opacity-50" />
                <p>Select a node to edit its settings.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

function toFlowNodes(workflow: ProductWorkflow): Node[] {
  return workflow.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }))
}

function defaultNodeData(
  type: WorkflowNode["type"],
  apiKeyId?: string,
): WorkflowNode["data"] {
  switch (type) {
    case "input":
      return {
        label: "User Input",
        fields: [
          {
            variableName: "topic",
            description: "What the user wants",
            type: "text",
          },
        ],
      }
    case "ai":
      return {
        label: "AI Step",
        systemRole: "You are a helpful assistant.",
        userInstructionTemplate: "Help with: {{topic}}",
        outputName: "result",
        apiKeyId,
      }
    case "output":
      return {
        label: "Output",
        template: "{{result}}",
        outputName: "finalOutput",
      }
    case "condition":
      return {
        label: "Condition",
        expression: '{{result}} == "yes"',
      }
    case "loop":
      return {
        label: "Loop",
        itemsExpression: "[1, 2, 3]",
        itemName: "item",
        maxIterations: 10,
      }
  }
}

function NodeToolbar({
  onAdd,
}: {
  onAdd: (type: WorkflowNode["type"]) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TooltipProvider>
        {(["input", "ai", "output", "condition", "loop"] as const).map(
          (type) => {
            const Icon = nodeTypeIcons[type]
            return (
              <Tooltip key={type}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAdd(type)}
                    >
                      <Icon className="size-4" />
                      <span className="capitalize">{nodeTypeLabels[type]}</span>
                    </Button>
                  }
                />
                <TooltipPopup side="bottom">
                  Add {nodeTypeLabels[type]} node
                </TooltipPopup>
              </Tooltip>
            )
          },
        )}
      </TooltipProvider>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  input: InputNodeComponent,
  ai: AINodeComponent,
  output: OutputNodeComponent,
  condition: ConditionNodeComponent,
  loop: LoopNodeComponent,
}

function BaseNode({
  node,
  children,
}: {
  node: NodeProps
  children: React.ReactNode
}) {
  const type = node.type as WorkflowNode["type"]
  const Icon = nodeTypeIcons[type]
  return (
    <Card className={`max-w-64 min-w-48 ${nodeTypeClasses[type]}`}>
      <CardPanel className="flex items-start gap-3 p-3">
        <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {(node.data as { label?: string }).label ?? nodeTypeLabels[type]}
          </div>
          <div className="text-muted-foreground truncate text-xs capitalize">
            {type}
          </div>
          {children}
        </div>
      </CardPanel>
    </Card>
  )
}

function InputNodeComponent(props: NodeProps) {
  const data = props.data as Extract<WorkflowNode, { type: "input" }>["data"]
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="bg-yellow-400!"
      />
      <BaseNode node={props}>
        <div className="text-muted-foreground mt-1 text-xs">
          {data.fields.length} field{data.fields.length === 1 ? "" : "s"}
        </div>
      </BaseNode>
      <Handle
        type="source"
        position={Position.Right}
        className="bg-yellow-400!"
      />
    </>
  )
}

function AINodeComponent(props: NodeProps) {
  const data = props.data as Extract<WorkflowNode, { type: "ai" }>["data"]
  return (
    <>
      <Handle type="target" position={Position.Left} className="bg-blue-400!" />
      <BaseNode node={props}>
        <div className="text-muted-foreground mt-1 text-xs">
          → {data.outputName}
        </div>
      </BaseNode>
      <Handle
        type="source"
        position={Position.Right}
        className="bg-blue-400!"
      />
    </>
  )
}

function OutputNodeComponent(props: NodeProps) {
  const data = props.data as Extract<WorkflowNode, { type: "output" }>["data"]
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="bg-green-400!"
      />
      <BaseNode node={props}>
        <div className="text-muted-foreground mt-1 text-xs">
          {data.outputName}
        </div>
      </BaseNode>
    </>
  )
}

function ConditionNodeComponent(props: NodeProps) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="bg-purple-400!"
      />
      <BaseNode node={props}>
        <div className="text-muted-foreground mt-1 text-xs">
          If / Else branch
        </div>
      </BaseNode>
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        className="bg-purple-400!"
        style={{ top: "35%" }}
      />
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        className="bg-purple-400!"
        style={{ top: "65%" }}
      />
    </>
  )
}

function LoopNodeComponent(props: NodeProps) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="bg-orange-400!"
      />
      <BaseNode node={props}>
        <div className="text-muted-foreground mt-1 text-xs">
          Iterate over items
        </div>
      </BaseNode>
      <Handle
        type="source"
        position={Position.Right}
        className="bg-orange-400!"
      />
    </>
  )
}

function NodeEditorPanel({
  node,
  apiKeys,
  availableModels,
  onChange,
  onDelete,
}: {
  node: Node
  apiKeys: ApiKeyConfig[]
  availableModels: string[]
  onChange: (data: Partial<WorkflowNode["data"]>) => void
  onDelete: () => void
}) {
  const type = node.type as WorkflowNode["type"]
  const data = node.data as WorkflowNode["data"]

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = nodeTypeIcons[type]
            return <Icon className="size-4" />
          })()}
          <span className="font-semibold">{nodeTypeLabels[type]} Settings</span>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onDelete}>
          <Trash2Icon className="text-destructive size-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <Field>
          <FieldLabel>Label</FieldLabel>
          <Input
            nativeInput
            value={data.label}
            onChange={(e) => onChange({ label: e.currentTarget.value })}
          />
        </Field>

        {type === "input" && (
          <InputNodeEditor
            data={data as Extract<WorkflowNode, { type: "input" }>["data"]}
            onChange={onChange}
          />
        )}

        {type === "ai" && (
          <AINodeEditor
            data={data as Extract<WorkflowNode, { type: "ai" }>["data"]}
            apiKeys={apiKeys}
            availableModels={availableModels}
            onChange={onChange}
          />
        )}

        {type === "output" && (
          <OutputNodeEditor
            data={data as Extract<WorkflowNode, { type: "output" }>["data"]}
            onChange={onChange}
          />
        )}

        {type === "condition" && (
          <ConditionNodeEditor
            data={data as Extract<WorkflowNode, { type: "condition" }>["data"]}
            onChange={onChange}
          />
        )}

        {type === "loop" && (
          <LoopNodeEditor
            data={data as Extract<WorkflowNode, { type: "loop" }>["data"]}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  )
}

const inputFieldTypeLabels: Record<InputFieldType, string> = {
  text: "Text",
  long_text: "Long Text",
  number: "Number",
  boolean: "Boolean",
  select: "Select",
  image: "Image",
  video: "Video",
}

type InputFieldType =
  | "text"
  | "long_text"
  | "number"
  | "boolean"
  | "select"
  | "image"
  | "video"

function InputNodeEditor({
  data,
  onChange,
}: {
  data: Extract<WorkflowNode, { type: "input" }>["data"]
  onChange: (data: Partial<WorkflowNode["data"]>) => void
}) {
  const updateField = (
    index: number,
    updates: Partial<{
      variableName: string
      description: string
      type: InputFieldType
      options?: { label: string; value: string }[]
      isOptional?: boolean
    }>,
  ) => {
    const fields = data.fields.map((f, i) =>
      i === index ? { ...f, ...updates } : f,
    )
    onChange({ fields })
  }

  const addField = () => {
    onChange({
      fields: [
        ...data.fields,
        { variableName: "", description: "", type: "text" },
      ],
    })
  }

  const deleteField = (index: number) => {
    onChange({ fields: data.fields.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-4">
      {data.fields.map((field, index) => (
        <Card key={index} className="bg-muted/30">
          <CardPanel className="flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase">
                Field {index + 1}
              </span>
              {data.fields.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => deleteField(index)}
                >
                  <Trash2Icon className="text-destructive size-3" />
                </Button>
              )}
            </div>

            <Field>
              <FieldLabel>Variable Name</FieldLabel>
              <Input
                nativeInput
                value={field.variableName}
                placeholder="topic"
                onChange={(e) =>
                  updateField(index, { variableName: e.currentTarget.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input
                nativeInput
                value={field.description}
                placeholder="What the user enters"
                onChange={(e) =>
                  updateField(index, { description: e.currentTarget.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select
                value={field.type}
                onValueChange={(value) => {
                  const v = Array.isArray(value) ? value[0] : value
                  if (v) updateField(index, { type: v as InputFieldType })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {Object.entries(inputFieldTypeLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectPopup>
              </Select>
            </Field>

            {field.type === "select" && (
              <SelectOptionsEditor
                options={field.options ?? []}
                onChange={(options) => updateField(index, { options })}
              />
            )}

            <label className="flex w-fit cursor-pointer items-center gap-2">
              <Checkbox
                checked={field.isOptional ?? false}
                onCheckedChange={(checked) =>
                  updateField(index, { isOptional: checked === true })
                }
              />
              <span className="text-sm">Optional</span>
            </label>
          </CardPanel>
        </Card>
      ))}

      <Button variant="outline" size="sm" onClick={addField}>
        <PlusIcon className="size-4" />
        Add field
      </Button>
    </div>
  )
}

function SelectOptionsEditor({
  options,
  onChange,
}: {
  options: { label: string; value: string }[]
  onChange: (options: { label: string; value: string }[]) => void
}) {
  const update = (index: number, field: "label" | "value", value: string) => {
    onChange(
      options.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    )
  }

  const add = () => {
    onChange([...options, { label: "", value: "" }])
  }

  const remove = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase">Options</span>
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            nativeInput
            value={option.label}
            placeholder="Label"
            onChange={(e) => update(index, "label", e.currentTarget.value)}
          />
          <Input
            nativeInput
            value={option.value}
            placeholder="value"
            onChange={(e) => update(index, "value", e.currentTarget.value)}
          />
          <Button variant="ghost" size="icon-xs" onClick={() => remove(index)}>
            <Trash2Icon className="text-destructive size-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <PlusIcon className="size-4" />
        Add option
      </Button>
    </div>
  )
}

function AINodeEditor({
  data,
  apiKeys,
  availableModels,
  onChange,
}: {
  data: Extract<WorkflowNode, { type: "ai" }>["data"]
  apiKeys: ApiKeyConfig[]
  availableModels: string[]
  onChange: (data: Partial<WorkflowNode["data"]>) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel>System Role</FieldLabel>
        <Textarea
          value={data.systemRole}
          rows={4}
          onChange={(e) => onChange({ systemRole: e.currentTarget.value })}
        />
      </Field>

      <Field>
        <FieldLabel>User Instruction Template</FieldLabel>
        <Textarea
          value={data.userInstructionTemplate}
          rows={6}
          onChange={(e) =>
            onChange({ userInstructionTemplate: e.currentTarget.value })
          }
        />
      </Field>

      <Field>
        <FieldLabel>Output Name</FieldLabel>
        <Input
          nativeInput
          value={data.outputName}
          onChange={(e) => onChange({ outputName: e.currentTarget.value })}
        />
      </Field>

      <Field>
        <FieldLabel>Output Format (optional override)</FieldLabel>
        <Select
          value={data.outputFormat ?? ""}
          onValueChange={(value) => {
            const v = Array.isArray(value) ? value[0] : value
            onChange({
              outputFormat: v
                ? (v as "plain" | "json" | "image" | "video")
                : undefined,
            })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Use product default" />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="">Use product default</SelectItem>
            <SelectItem value="plain">Plain</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectPopup>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Model Engine (optional override)</FieldLabel>
        <Select
          value={data.modelEngine ?? ""}
          onValueChange={(value) => {
            const v = Array.isArray(value) ? value[0] : value
            onChange({ modelEngine: v ?? undefined })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Use product default" />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="">Use product default</SelectItem>
            {availableModels.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Field>

      <Field>
        <FieldLabel>API Key (optional override)</FieldLabel>
        <Select
          value={data.apiKeyId ?? ""}
          onValueChange={(value) => {
            const v = Array.isArray(value) ? value[0] : value
            onChange({ apiKeyId: v ?? undefined })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Use product default" />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="">Use product default</SelectItem>
            {apiKeys.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Field>
    </div>
  )
}

function OutputNodeEditor({
  data,
  onChange,
}: {
  data: Extract<WorkflowNode, { type: "output" }>["data"]
  onChange: (data: Partial<WorkflowNode["data"]>) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel>Output Template</FieldLabel>
        <Textarea
          value={data.template}
          rows={8}
          onChange={(e) => onChange({ template: e.currentTarget.value })}
        />
      </Field>

      <Field>
        <FieldLabel>Output Name</FieldLabel>
        <Input
          nativeInput
          value={data.outputName}
          onChange={(e) => onChange({ outputName: e.currentTarget.value })}
        />
      </Field>
    </div>
  )
}

function ConditionNodeEditor({
  data,
  onChange,
}: {
  data: Extract<WorkflowNode, { type: "condition" }>["data"]
  onChange: (data: Partial<WorkflowNode["data"]>) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel>Expression</FieldLabel>
        <Textarea
          value={data.expression}
          rows={3}
          onChange={(e) => onChange({ expression: e.currentTarget.value })}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Use {"{{outputName}}"} to reference values. Example:
          {'{{result}} == "yes"'}
        </p>
      </Field>
    </div>
  )
}

function LoopNodeEditor({
  data,
  onChange,
}: {
  data: Extract<WorkflowNode, { type: "loop" }>["data"]
  onChange: (data: Partial<WorkflowNode["data"]>) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel>Items Expression</FieldLabel>
        <Textarea
          value={data.itemsExpression}
          rows={3}
          onChange={(e) => onChange({ itemsExpression: e.currentTarget.value })}
        />
      </Field>

      <Field>
        <FieldLabel>Item Variable Name</FieldLabel>
        <Input
          nativeInput
          value={data.itemName}
          onChange={(e) => onChange({ itemName: e.currentTarget.value })}
        />
      </Field>

      <Field>
        <FieldLabel>Max Iterations</FieldLabel>
        <Input
          nativeInput
          type="number"
          min={1}
          max={100}
          value={data.maxIterations}
          onChange={(e) =>
            onChange({ maxIterations: Number(e.currentTarget.value) })
          }
        />
      </Field>
    </div>
  )
}
