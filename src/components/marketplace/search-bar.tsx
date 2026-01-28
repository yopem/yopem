"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  onSearch: (query: string) => void
  defaultValue?: string
}

function SearchBar({ onSearch, defaultValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full max-w-md">
      <Input
        type="search"
        placeholder="Search tools..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-10"
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-0"
      >
        <SearchIcon className="size-4" />
      </Button>
    </form>
  )
}

export default SearchBar
