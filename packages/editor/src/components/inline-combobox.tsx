"use client"

import type { TSuggestionElement } from "@platejs/utils"
import type { PointRef, TElement } from "platejs"
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  RefObject,
} from "react"

import { filterWords } from "@platejs/combobox"
import {
  type UseComboboxInputResult,
  useComboboxInput,
  useHTMLInputCursorState,
} from "@platejs/combobox/react"
import { useComposedRef } from "@udecode/react-utils"
import { useEditorRef } from "platejs/react"
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { createPortal } from "react-dom"

import { cn, cva } from "ui/utils"

type FilterFn = (
  item: { value: string; group?: string; keywords?: string[]; label?: string },
  search: string,
) => boolean

interface ItemRegistration {
  onSelect: () => void
  visible: boolean
}

function createVisibleStore() {
  const items = new Map<string, ItemRegistration>()
  const listeners = new Set<() => void>()
  let cachedSnapshot: string[] = []
  let snapshotDirty = true

  function emit() {
    snapshotDirty = true
    for (const listener of listeners) listener()
  }

  return {
    getItem: (itemValue: string) => items.get(itemValue),
    getSnapshot: () => {
      if (snapshotDirty) {
        const next: string[] = []
        for (const [key, item] of items.entries()) {
          if (item.visible) next.push(key)
        }
        cachedSnapshot = next
        snapshotDirty = false
      }
      return cachedSnapshot
    },
    register: (itemValue: string, visible: boolean, onSelect: () => void) => {
      items.set(itemValue, { onSelect, visible })
      emit()
      return () => {
        items.delete(itemValue)
        emit()
      }
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

interface InlineComboboxContextValue {
  activeValue: string | null
  filter: FilterFn | false
  inputProps: UseComboboxInputResult["props"]
  inputRef: RefObject<HTMLInputElement | null>
  listboxRef: RefObject<HTMLDivElement | null>
  open: boolean
  removeInput: UseComboboxInputResult["removeInput"]
  setActiveValue: (value: string | null) => void
  setHasEmpty: (hasEmpty: boolean) => void
  setValue: (value: string) => void
  showTrigger: boolean
  trigger: string
  value: string
  visibleValues: string[]
  register: (
    value: string,
    visible: boolean,
    onSelect: () => void,
  ) => () => void
}

const InlineComboboxContext = createContext<InlineComboboxContextValue | null>(
  null,
)

function scrollActiveIntoView(
  listbox: HTMLDivElement | null,
  value: string | null,
) {
  if (!listbox || !value) return
  const active = listbox.querySelector(`[role="option"][data-active="true"]`)
  if (active) {
    active.scrollIntoView({ block: "nearest" })
  }
}

function defaultFilter(
  {
    group,
    keywords = [],
    label,
    value,
  }: {
    value: string
    group?: string
    keywords?: string[]
    label?: string
  },
  search: string,
): boolean {
  const uniqueTerms = new Set(
    [value, ...keywords, group, label].filter(Boolean),
  )

  return Array.from(uniqueTerms).some((keyword) =>
    filterWords(keyword!, search),
  )
}

interface InlineComboboxProps {
  children: ReactNode
  element: TElement
  trigger: string
  filter?: FilterFn | false
  hideWhenNoValue?: boolean
  showTrigger?: boolean
  value?: string
  setValue?: (value: string) => void
}

export function InlineCombobox({
  children,
  element,
  filter = defaultFilter,
  hideWhenNoValue = false,
  setValue: setValueProp,
  showTrigger = true,
  trigger,
  value: valueProp,
}: InlineComboboxProps) {
  const editor = useEditorRef()
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const cursorState = useHTMLInputCursorState(inputRef)

  const [valueState, setValueState] = useState("")
  const hasValueProp = valueProp !== undefined
  const value = hasValueProp ? valueProp : valueState

  const elementUserId = (element as TSuggestionElement).suggestion?.userId
  const currentUserId = editor.meta?.userId
  const isCreator = !elementUserId || elementUserId === currentUserId

  const setValue = useCallback(
    (newValue: string) => {
      setValueProp?.(newValue)

      if (!hasValueProp) {
        setValueState(newValue)
      }
    },
    [setValueProp, hasValueProp],
  )

  const insertPointRef = useRef<PointRef | null>(null)

  useEffect(() => {
    insertPointRef.current?.unref()
    insertPointRef.current = null

    const path = editor.api.findPath(element)

    if (!path) return

    const point = editor.api.before(path)

    if (!point) return

    const pointRef = editor.api.pointRef(point)
    insertPointRef.current = pointRef

    return () => {
      if (insertPointRef.current === pointRef) {
        insertPointRef.current = null
      }
      pointRef.unref()
    }
  }, [editor, element])

  const { props: inputProps, removeInput } = useComboboxInput({
    cancelInputOnBlur: true,
    cursorState,
    autoFocus: isCreator,
    ref: inputRef,
    onCancelInput: (cause) => {
      if (cause !== "backspace") {
        editor.tf.insertText(trigger + value, {
          at: insertPointRef.current?.current ?? undefined,
        })
      }

      if (cause === "arrowLeft" || cause === "arrowRight") {
        editor.tf.move({
          distance: 1,
          reverse: cause === "arrowLeft",
        })
      }
    },
  })

  const [hasEmpty, setHasEmpty] = useState(false)
  const [store] = useState(createVisibleStore)
  const visibleValues = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => [],
  )
  const [activeIndex, setActiveIndex] = useState(0)

  const open =
    (visibleValues.length > 0 || hasEmpty) &&
    (!hideWhenNoValue || value.length > 0)

  const activeIndexBounded = Math.min(activeIndex, visibleValues.length - 1)
  const register = store.register

  const activeValue = visibleValues[activeIndexBounded] ?? null

  const setActiveValue = useCallback(
    (nextValue: string | null) => {
      const index = nextValue ? visibleValues.indexOf(nextValue) : -1
      if (index >= 0) {
        setActiveIndex(index)
      }
    },
    [visibleValues],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      inputProps.onKeyDown?.(event)

      if (!open) return

      if (event.key === "ArrowDown") {
        event.preventDefault()
        event.stopPropagation()
        if (visibleValues.length === 0) return
        const nextIndex = (activeIndexBounded + 1) % visibleValues.length
        const next = visibleValues[nextIndex]
        startTransition(() => {
          setActiveIndex(nextIndex)
          scrollActiveIntoView(listboxRef.current, next)
        })
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        event.stopPropagation()
        if (visibleValues.length === 0) return
        const nextIndex =
          (activeIndexBounded - 1 + visibleValues.length) % visibleValues.length
        const next = visibleValues[nextIndex]
        startTransition(() => {
          setActiveIndex(nextIndex)
          scrollActiveIntoView(listboxRef.current, next)
        })
      } else if (event.key === "Enter" && activeValue) {
        event.preventDefault()
        event.stopPropagation()
        const item = store.getItem(activeValue)
        if (item) {
          startTransition(() => item.onSelect())
        }
      }
    },
    [inputProps, open, visibleValues, activeIndexBounded, activeValue, store],
  )

  const contextValue = useMemo(
    () => ({
      activeValue,
      filter,
      inputProps: { ...inputProps, onKeyDown: handleKeyDown },
      inputRef,
      listboxRef,
      open,
      register,
      removeInput,
      setActiveValue,
      setHasEmpty,
      setValue,
      showTrigger,
      trigger,
      value,
      visibleValues,
    }),
    [
      activeValue,
      filter,
      handleKeyDown,
      inputProps,
      inputRef,
      listboxRef,
      open,
      register,
      removeInput,
      setActiveValue,
      setHasEmpty,
      setValue,
      showTrigger,
      trigger,
      value,
      visibleValues,
    ],
  )

  return (
    <span contentEditable={false}>
      <InlineComboboxContext.Provider value={contextValue}>
        {children}
      </InlineComboboxContext.Provider>
    </span>
  )
}

export function InlineComboboxInput({
  className,
  ref: propRef,
  ...props
}: HTMLAttributes<HTMLInputElement> & {
  ref?: RefObject<HTMLInputElement | null>
}) {
  const context = useContext(InlineComboboxContext)
  if (!context)
    throw new Error("InlineComboboxInput must be inside InlineCombobox")

  const { inputProps, inputRef, setValue, showTrigger, trigger, value } =
    context

  const ref = useComposedRef(propRef, inputRef)

  return (
    <>
      {showTrigger ? trigger : null}
      <span className="relative min-h-lh">
        <span
          className="invisible overflow-hidden text-nowrap"
          aria-hidden="true"
        >
          {value || "\u200B"}
        </span>
        <input
          ref={ref}
          className={cn(
            "absolute top-0 left-0 size-full bg-transparent outline-none",
            className,
          )}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          {...inputProps}
          {...props}
        />
      </span>
    </>
  )
}

InlineComboboxInput.displayName = "InlineComboboxInput"

interface InlineComboboxContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function InlineComboboxContent({
  children,
  className,
  ...props
}: InlineComboboxContentProps) {
  const context = useContext(InlineComboboxContext)
  if (!context)
    throw new Error("InlineComboboxContent must be inside InlineCombobox")

  const { inputRef, listboxRef, open, visibleValues } = context
  const [style, setStyle] = useState<React.CSSProperties>({})

  const updatePosition = useCallback(() => {
    const input = inputRef.current
    if (!input || !open) return

    const rect = input.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return

    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const listbox = listboxRef.current
    const listboxHeight = listbox?.offsetHeight ?? 320
    const listboxWidth = listbox?.offsetWidth ?? 320

    const margin = 8
    const spaceBelow = viewportHeight - rect.bottom - margin
    const spaceAbove = rect.top - margin

    const showAbove =
      spaceBelow < Math.min(listboxHeight, 200) && spaceAbove > spaceBelow

    let top: number | undefined
    let bottom: number | undefined
    let maxHeight: number

    if (showAbove) {
      bottom = viewportHeight - rect.top + 4
      maxHeight = Math.max(80, Math.min(320, spaceAbove - 4))
    } else {
      top = rect.bottom + 4
      maxHeight = Math.max(80, Math.min(320, spaceBelow - 4))
    }

    let left = rect.left
    if (left + listboxWidth > viewportWidth - margin) {
      left = Math.max(margin, viewportWidth - listboxWidth - margin)
    }
    left = Math.max(margin, left)

    setStyle({
      position: "fixed",
      top: top ?? "auto",
      bottom: bottom ?? "auto",
      left,
      maxHeight,
      zIndex: 500,
    })
  }, [inputRef, listboxRef, open])

  useLayoutEffect(() => {
    if (!open) return

    updatePosition()

    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)

    const rafId = requestAnimationFrame(() => {
      updatePosition()
    })

    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
      cancelAnimationFrame(rafId)
    }
  }, [open, updatePosition, visibleValues])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      ref={listboxRef}
      role="listbox"
      aria-label="Suggestions"
      className={cn(
        "bg-popover text-popover-foreground w-80 overflow-y-auto rounded-xl border p-1 shadow-lg/5",
        !open && "hidden",
        className,
      )}
      style={style}
      onMouseDown={(event) => event.preventDefault()}
      {...props}
    >
      {children}
    </div>,
    document.body,
  )
}

const comboboxItemVariants = cva(
  "text-foreground relative flex min-h-8 items-center gap-3 rounded-md px-2 py-1 text-sm outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      interactive: true,
    },
    variants: {
      interactive: {
        false: "text-muted-foreground",
        true: "hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground cursor-pointer transition-colors",
      },
    },
  },
)

interface InlineComboboxItemProps extends Omit<
  ComponentProps<"div">,
  "onClick" | "value"
> {
  focusEditor?: boolean
  group?: string
  keywords?: string[]
  label?: string
  onClick?: () => void
  value: string
}

export function InlineComboboxItem({
  className,
  focusEditor = true,
  group,
  keywords,
  label,
  onClick,
  value: itemValue,
  ...props
}: InlineComboboxItemProps) {
  const context = useContext(InlineComboboxContext)
  if (!context)
    throw new Error("InlineComboboxItem must be inside InlineCombobox")

  const { filter, removeInput, setActiveValue, value, register, activeValue } =
    context

  const visible =
    filter === false ||
    filter({ group, keywords, label, value: itemValue }, value)

  const onClickRef = useRef(onClick)

  useEffect(() => {
    onClickRef.current = onClick
  }, [onClick])

  useLayoutEffect(() => {
    return register(itemValue, visible, () => {
      removeInput(focusEditor)
      onClickRef.current?.()
    })
  }, [itemValue, visible, focusEditor, register, removeInput])

  if (!visible) return null

  const isActive = activeValue === itemValue

  return (
    <div
      role="option"
      tabIndex={-1}
      aria-selected={isActive}
      data-active={isActive}
      className={cn(comboboxItemVariants(), className)}
      onMouseEnter={() => setActiveValue(itemValue)}
      onClick={() => {
        removeInput(focusEditor)
        onClick?.()
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          removeInput(focusEditor)
          onClick?.()
        }
      }}
      {...props}
    />
  )
}

interface InlineComboboxEmptyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hideOnEmptySearch?: boolean
}

export function InlineComboboxEmpty({
  children,
  className,
  hideOnEmptySearch = false,
  ...props
}: InlineComboboxEmptyProps) {
  const context = useContext(InlineComboboxContext)
  if (!context)
    throw new Error("InlineComboboxEmpty must be inside InlineCombobox")

  const { setHasEmpty, value, visibleValues } = context
  const show =
    visibleValues.length === 0 && (!hideOnEmptySearch || value.length > 0)

  useLayoutEffect(() => {
    setHasEmpty(show)
    return () => setHasEmpty(false)
  }, [show, setHasEmpty])

  if (!show) return null

  return (
    <div
      className={cn(comboboxItemVariants({ interactive: false }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function InlineComboboxGroup({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn("py-1 not-last:border-b", className)} {...props} />
}

export function InlineComboboxGroupLabel({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-muted-foreground px-2 py-1.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  )
}
