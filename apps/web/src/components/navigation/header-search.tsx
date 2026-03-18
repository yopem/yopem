"use client"

import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { SearchIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { queryApi } from "rpc/query"

import SearchResults from "./search-results"

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

const HeaderSearch = () => {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const debouncedQuery = useDebounce(query, 300)
  const shouldSearch = debouncedQuery.trim().length >= 2

  const { data, isLoading } = useQuery({
    ...queryApi.tools.search.queryOptions({
      input: {
        query: debouncedQuery.trim(),
        limit: 8,
      },
    }),
    enabled: shouldSearch,
  })

  const results = data?.results ?? []
  const showDropdown = isFocused && shouldSearch

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault()
        if (mobileOpen) {
          inputRef.current?.focus()
        } else {
          inputRef.current?.focus()
        }
      }
      if (e.key === "Escape") {
        setQuery("")
        setIsFocused(false)
        setMobileOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [mobileOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [mobileOpen])

  const handleSeeAll = () => {
    const q = query.trim()
    if (q) {
      void navigate({ to: "/marketplace", search: { search: q } })
      setQuery("")
      setIsFocused(false)
      setMobileOpen(false)
    }
  }

  const handleResultClick = () => {
    setQuery("")
    setIsFocused(false)
    setMobileOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSeeAll()
  }

  return (
    <>
      <div ref={containerRef} className="relative hidden md:block">
        <form onSubmit={handleSubmit} className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="bg-muted/50 border-border focus:bg-background focus:ring-ring w-52 rounded-md border py-1.5 pr-8 pl-9 text-sm transition-all outline-none focus:w-72 focus:ring-1"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : (
            <kbd className="text-muted-foreground border-border absolute top-1/2 right-2 -translate-y-1/2 rounded-sm border px-1 py-0.5 font-mono text-[10px]">
              /
            </kbd>
          )}
        </form>

        {showDropdown && (
          <SearchResults
            results={results}
            isLoading={isLoading}
            query={debouncedQuery.trim()}
            onSeeAll={handleSeeAll}
            onResultClick={handleResultClick}
          />
        )}
      </div>

      <button
        type="button"
        className="hover:bg-accent flex items-center justify-center rounded-md p-2 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Search"
      >
        <SearchIcon className="size-5" />
      </button>

      {mobileOpen && (
        <div className="bg-background fixed inset-0 z-50 flex flex-col md:hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <form onSubmit={handleSubmit} className="relative flex-1">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tools..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                className="bg-muted/50 focus:ring-ring w-full rounded-md py-2 pr-8 pl-9 text-sm outline-none focus:ring-1"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </form>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                setQuery("")
              }}
              className="text-muted-foreground hover:text-foreground shrink-0 text-sm"
            >
              Cancel
            </button>
          </div>

          {showDropdown && (
            <SearchResults
              results={results}
              isLoading={isLoading}
              query={debouncedQuery.trim()}
              onSeeAll={handleSeeAll}
              onResultClick={handleResultClick}
              mobile
            />
          )}
        </div>
      )}
    </>
  )
}

export default HeaderSearch
