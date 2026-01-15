"use client"

import { useState } from "react"
import { CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"

interface KeyInputFieldProps {
  value: string
  label: string
  helperText?: string
  onRegenerate?: () => void
}

const KeyInputField = ({
  value,
  label,
  helperText,
  onRegenerate,
}: KeyInputFieldProps) => {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <span className="text-foreground text-sm font-medium">{label}</span>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>
      <InputGroup>
        <InputGroupInput
          readOnly
          type={showKey ? "text" : "password"}
          value={value}
          className="pe-24"
        />
        <InputGroupAddon align="inline-end" className="gap-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label={showKey ? "Hide key" : "Show key"}
                  onClick={() => setShowKey(!showKey)}
                  size="icon-xs"
                  variant="ghost"
                />
              }
            >
              {showKey ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipPopup>{showKey ? "Hide key" : "Show key"}</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Copy key"
                  onClick={handleCopy}
                  size="icon-xs"
                  variant="ghost"
                />
              }
            >
              <CopyIcon className="size-4" />
            </TooltipTrigger>
            <TooltipPopup>{copied ? "Copied!" : "Copy key"}</TooltipPopup>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  )
}

export default KeyInputField
