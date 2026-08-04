import { Link } from "@tanstack/react-router"
import { PlusIcon, SparklesIcon } from "lucide-react"

import { Button } from "ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "ui/empty"

export function EmptyProductState() {
  return (
    <Empty className="py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SparklesIcon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>No products yet</EmptyTitle>
        <EmptyDescription>
          Products are AI-powered features your users can run. Start with one
          input variable, a prompt, and an AI model.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-muted-foreground">
            1. Define what information the user provides
          </span>
          <span className="text-muted-foreground">
            2. Write the system role and user instruction
          </span>
          <span className="text-muted-foreground">
            3. Choose a model and publish
          </span>
        </div>
        <Button render={<Link to="/products/add" />}>
          <PlusIcon className="size-4" />
          <span>Create your first product</span>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
