"use client"

import { useNavigate } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { useState } from "react"

import { Input } from "ui/input"

export function HeaderSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    void navigate({
      to: "/products",
      search: trimmed ? { search: trimmed } : {},
    })
  }

  return (
    <form onSubmit={handleSubmit} className="relative hidden md:block">
      <SearchIcon className="text-muted-foreground/60 absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Search tools..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 w-52 pl-8 text-xs"
      />
    </form>
  )
}
