"use client"

import { Search as SearchIcon, X as XIcon } from "lucide-react"
import { type FormEvent, useState } from "react"

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
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <input
        id="marketplace-search"
        type="text"
        placeholder="Search tools..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search marketplace tools"
        className="bg-muted/50 border-border focus:bg-background focus:ring-ring w-full rounded-md border py-2 pr-8 pl-9 text-sm outline-none focus:ring-1"
      />
      {query ? (
        <button
          type="button"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
        >
          <XIcon className="size-3.5" />
          <span className="sr-only">Clear search</span>
        </button>
      ) : null}
    </form>
  )
}

export default SearchBar
