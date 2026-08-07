import { Link } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "ui/button"
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "ui/empty"

export function EmptyProductState() {
  return (
    <Empty className="py-16">
      <EmptyHeader>
        <EmptyTitle>No products yet</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link to="/products/add" />}>
          <PlusIcon className="size-4" />
          <span>Create Product</span>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
