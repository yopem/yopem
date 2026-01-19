"use client"

import { useState } from "react"

import ConfigurationPanel from "@/components/admin/tools/configuration-panel"
import FeatureBuilderHeader from "@/components/admin/tools/feature-builder-header"
import FeatureBuilderTabs from "@/components/admin/tools/feature-builder-tabs"
import InputSchemaSection from "@/components/admin/tools/input-schema-section"
import PromptLogicSection from "@/components/admin/tools/prompt-logic-section"
import { Separator } from "@/components/ui/separator"

const modelOptions = [
  "GPT-4 Turbo",
  "GPT-3.5 Turbo",
  "Claude 3 Opus",
  "Mistral Large",
]

const mockVariableNames = ["user_topic", "tone_style"]

function AddToolPage() {
  const [activeTab, setActiveTab] = useState("builder")
  const [inputFields, setInputFields] = useState([
    {
      id: "1",
      variableName: "user_topic",
      type: "text" as const,
      description: "Main subject of the blog post",
    },
    {
      id: "2",
      variableName: "tone_style",
      type: "select" as const,
      description: "Formal, Casual, or Humorous",
    },
  ])
  const [systemRole, setSystemRole] = useState(
    "You are an expert SEO copywriter with 10 years of experience in digital marketing. Your goal is to write engaging, high-ranking content.",
  )
  const [userInstructionTemplate, setUserInstructionTemplate] = useState(
    `Write a comprehensive blog post about {{user_topic}}.
The tone should be {{tone_style}}.
Please include:
1. An engaging hook.
2. 3 main sections with headers.
3. A conclusion with a call to action.
Ensure the content is optimized for readability.`,
  )
  const [modelEngine, setModelEngine] = useState(modelOptions[0])
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [outputFormat, setOutputFormat] = useState<"plain" | "json">("plain")
  const [costPerRun, setCostPerRun] = useState(0.05)
  const markup = 0.2

  const handleAddField = () => {
    const newId = String(Date.now())
    setInputFields([
      ...inputFields,
      {
        id: newId,
        variableName: "new_field",
        type: "text" as const,
        description: "New field description",
      },
    ])
  }

  const handleDeleteField = (id: string) => {
    setInputFields(inputFields.filter((f) => f.id !== id))
  }

  const handleInsertVariable = (variable: string) => {
    setUserInstructionTemplate((prev) => `${prev}\n{{${variable}}}`)
  }

  const handleTestRun = () => {
    console.info("Test Run clicked")
  }

  const handleSave = () => {
    console.info("Save clicked")
  }

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/dashboard/admin/tools" },
          { label: "New Tool" },
        ]}
        status="Draft"
        onTestRun={handleTestRun}
        onSave={handleSave}
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
          <FeatureBuilderTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          {activeTab === "builder" && (
            <>
              <InputSchemaSection
                fields={inputFields}
                onAddField={handleAddField}
                onDeleteField={handleDeleteField}
              />
              <Separator />
              <PromptLogicSection
                systemRole={systemRole}
                userInstructionTemplate={userInstructionTemplate}
                variableNames={mockVariableNames}
                onSystemRoleChange={setSystemRole}
                onUserInstructionChange={setUserInstructionTemplate}
                onInsertVariable={handleInsertVariable}
              />
            </>
          )}
        </div>
        <ConfigurationPanel
          modelEngine={modelEngine}
          temperature={temperature}
          maxTokens={maxTokens}
          outputFormat={outputFormat}
          costPerRun={costPerRun}
          markup={markup}
          modelOptions={modelOptions}
          onModelEngineChange={setModelEngine}
          onTemperatureChange={setTemperature}
          onMaxTokensChange={setMaxTokens}
          onOutputFormatChange={setOutputFormat}
          onCostPerRunChange={setCostPerRun}
        />
      </div>
    </>
  )
}

export default AddToolPage
