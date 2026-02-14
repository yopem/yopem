"use client"

import { Search as SearchIcon, X as XIcon } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  onSearch: (query: string) => void
  defaultValue?: string
}

const SearchBar = ({ onSearch, defaultValue = "" }: SearchBarProps) => {
  const [query, setQuery] = useState(defaultValue)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleClear = () => {
    setQuery("")
    onSearch("")
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2" />
          <Input
            id="marketplace-search"
            type="search"
            placeholder="Search tools by name or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search marketplace tools"
            className="focus:border-foreground/20 placeholder:text-muted-foreground/70 h-11 px-10 text-sm transition-colors duration-200 [&_input]:h-full [&_input]:py-0"
          />
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 z-10 -translate-y-1/2 transition-colors duration-200"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Clear search</span>
            </button>
          ) : null}
        </div>
        <Button
          type="submit"
          className="flex h-11 shrink-0 items-center justify-center px-6 text-sm font-medium transition-colors duration-200 sm:h-11"
        >
          Search
        </Button>
      </div>
    </form>
  )
}

export default SearchBar
