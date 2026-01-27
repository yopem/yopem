"use client"

import { useEffect, useState } from "react"
import { LoaderCircleIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ToolInputVariable {
  variableName: string
  description: string
  type: string
}

interface ToolTestSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inputVariables: ToolInputVariable[]
  onExecute: (inputs: Record<string, string>) => void
  isExecuting: boolean
  result: string | null
}

const ToolTestSheet = ({
  open,
  onOpenChange,
  inputVariables,
  onExecute,
  isExecuting,
  result,
}: ToolTestSheetProps) => {
  const [testInputs, setTestInputs] = useState<Record<string, string>>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [open])

  const handleExecuteTest = () => {
    void onExecute(testInputs)
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onOpenChange(false), 200)
  }

  if (!open) return null

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`bg-popover text-popover-foreground fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-lg transition-transform duration-200 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={handleClose}
          className="absolute top-2 right-2 z-10"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </Button>

        <div className="flex flex-col gap-2 border-b p-6">
          <h2 className="font-heading text-xl leading-none font-semibold">
            Test Tool Execution
          </h2>
          <p className="text-muted-foreground text-sm">
            Test your tool with sample inputs before deploying.
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-6">
            {inputVariables.length > 0 && (
              <div className="flex flex-col gap-4">
                {inputVariables.map((field) => (
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

            <Button onClick={handleExecuteTest} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                "Execute Test"
              )}
            </Button>

            {result && (
              <div className="bg-muted mt-4 rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Result:</h4>
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

export default ToolTestSheet
export { type ToolTestSheetProps, type ToolInputVariable }
