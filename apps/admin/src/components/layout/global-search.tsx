"use client"

import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BotIcon,
  CornerDownLeftIcon,
  LayoutGridIcon,
  SearchIcon,
  TagIcon,
} from "lucide-react"
import { useDeferredValue, useEffect, useMemo, useState } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from "ui/command"

type SearchResultType = "product" | "category" | "tag"

interface SearchResult {
  id: string
  label: string
  type: SearchResultType
  description?: string | null
  status?: string | null
}

interface SearchGroup {
  value: string
  icon: React.ReactNode
  items: SearchResult[]
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const navigate = useNavigate()

  const { data: categories } = useQuery(queryApi.categories.list.queryOptions())
  const { data: tags } = useQuery(queryApi.tags.list.queryOptions())
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    ...queryApi.products.list.queryOptions({
      input: {
        limit: 8,
        search: deferredQuery.trim() || undefined,
        status: "all",
      },
    }),
    enabled: deferredQuery.trim().length > 0,
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((previous) => !previous)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.toLowerCase()
    return (categories ?? [])
      .filter(
        (category) =>
          category.name.toLowerCase().includes(normalizedQuery) ||
          (category.description ?? "").toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 5)
  }, [categories, query])

  const filteredTags = useMemo(() => {
    const normalizedQuery = query.toLowerCase()
    return (tags ?? [])
      .filter((tag) => tag.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 5)
  }, [tags, query])

  const groups = useMemo<SearchGroup[]>(
    () =>
      [
        {
          value: "Products",
          icon: <BotIcon className="size-4" />,
          items: (productsData?.products ?? []).map((product) => ({
            id: product.id,
            label: product.name,
            type: "product" as const,
            status: product.status,
          })),
        },
        {
          value: "Categories",
          icon: <LayoutGridIcon className="size-4" />,
          items: filteredCategories.map((category) => ({
            id: category.id,
            label: category.name,
            type: "category" as const,
            description: category.description,
          })),
        },
        {
          value: "Tags",
          icon: <TagIcon className="size-4" />,
          items: filteredTags.map((tag) => ({
            id: tag.id,
            label: tag.name,
            type: "tag" as const,
          })),
        },
      ].filter((group) => group.items.length > 0),
    [productsData, filteredCategories, filteredTags],
  )

  const handleSelect = (item: SearchResult) => {
    setOpen(false)
    setQuery("")

    if (item.type === "product") {
      void navigate({
        to: "/products/edit/$productId",
        params: { productId: item.id },
      })
      return
    }

    void navigate({
      to: "/categories-tags",
      search:
        item.type === "category" ? { categoryId: item.id } : { tagId: item.id },
    })
  }

  const hasResults = groups.length > 0
  const showEmpty =
    !hasResults &&
    query.trim().length > 0 &&
    !isLoadingProducts &&
    deferredQuery.trim().length > 0

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandDialogTrigger render={<Button size="sm" variant="outline" />}>
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <CommandShortcut>⌘K</CommandShortcut>
      </CommandDialogTrigger>

      <CommandDialogPopup>
        <Command items={groups}>
          <CommandInput
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search products, categories, tags..."
            value={query}
          />
          <CommandPanel>
            <CommandList>
              {(group: SearchGroup, groupIndex: number) => (
                <div key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel className="flex items-center gap-2">
                      {group.icon}
                      {group.value}
                    </CommandGroupLabel>
                    <CommandCollection>
                      {(item: SearchResult) => (
                        <CommandItem
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          value={`${item.type}:${item.id}:${item.label}`}
                        >
                          <span className="flex flex-1 items-center gap-2">
                            {item.label}
                            {item.status && (
                              <span className="text-muted-foreground text-xs capitalize">
                                {item.status}
                              </span>
                            )}
                          </span>
                          {item.description && (
                            <span className="text-muted-foreground line-clamp-1 max-w-40 text-xs">
                              {item.description}
                            </span>
                          )}
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  {groupIndex < groups.length - 1 && <CommandSeparator />}
                </div>
              )}
            </CommandList>
            {showEmpty && <CommandEmpty>No results found.</CommandEmpty>}
          </CommandPanel>
          <CommandFooter>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <ArrowUpIcon className="size-3" />
                  <ArrowDownIcon className="size-3" />
                </span>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <CornerDownLeftIcon className="size-3" />
                <span>Open</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Esc</span>
              <span>Close</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}
