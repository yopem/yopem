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
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

import { cn, cva } from "ui"

type FilterFn = (
  item: { value: string; group?: string; keywords?: string[]; label?: string },
  search: string,
) => boolean

interface ItemRegistration {
  onSelect: () => void
  visible: boolean
}

interface InlineComboboxContextValue {
  activeValue: string | null
  filter: FilterFn | false
  inputProps: UseComboboxInputResult["props"]
  inputRef: RefObject<HTMLInputElement | null>
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

const listboxRef: RefObject<HTMLDivElement | null> = { current: null }

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

const defaultFilter: FilterFn = (
  { group, keywords = [], label, value },
  search,
) => {
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
  const cursorState = useHTMLInputCursorState(inputRef)

  const [valueState, setValueState] = useState("")
  const hasValueProp = valueProp !== undefined
  const value = hasValueProp ? valueProp : valueState

  const elementUserId = (element as TSuggestionElement).suggestion?.userId
  const currentUserId = editor.meta?.userId
  const isCreator = !elementUserId || elementUserId === currentUserId

  const setValue = (newValue: string) => {
    setValueProp?.(newValue)

    if (!hasValueProp) {
      setValueState(newValue)
    }
  }

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
  const itemsRef = useRef<Map<string, ItemRegistration>>(new Map())
  const [visibleValues, setVisibleValues] = useState<string[]>([])
  const pendingVisibleRef = useRef<string[] | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const open =
    (visibleValues.length > 0 || hasEmpty) &&
    (!hideWhenNoValue || value.length > 0)

  useEffect(() => {
    if (activeIndex >= visibleValues.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, visibleValues.length])

  const visibleValuesRef = useRef<string[]>(visibleValues)
  visibleValuesRef.current = visibleValues

  const flushVisibleValues = () => {
    if (pendingVisibleRef.current) {
      setVisibleValues(pendingVisibleRef.current)
      pendingVisibleRef.current = null
    }
  }

  const updateVisibleValues = () => {
    const next: string[] = []
    for (const [key, item] of itemsRef.current.entries()) {
      if (item.visible) next.push(key)
    }
    if (next.join(",") !== visibleValuesRef.current.join(",")) {
      pendingVisibleRef.current = next
    }
  }

  const register = (
    itemValue: string,
    visible: boolean,
    onSelect: () => void,
  ) => {
    itemsRef.current.set(itemValue, { onSelect, visible })
    updateVisibleValues()

    return () => {
      itemsRef.current.delete(itemValue)
      updateVisibleValues()
    }
  }

  const activeValue = visibleValues[activeIndex] ?? null

  const setActiveValue = (nextValue: string | null) => {
    const index = nextValue ? visibleValues.indexOf(nextValue) : -1
    if (index >= 0) {
      setActiveIndex(index)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    inputProps.onKeyDown?.(event)

    if (!open) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      event.stopPropagation()
      if (visibleValues.length === 0) return
      const next = visibleValues[(activeIndex + 1) % visibleValues.length]
      startTransition(() => {
        setActiveIndex((activeIndex + 1) % visibleValues.length)
        scrollActiveIntoView(listboxRef.current, next)
      })
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      event.stopPropagation()
      if (visibleValues.length === 0) return
      const next =
        visibleValues[
          (activeIndex - 1 + visibleValues.length) % visibleValues.length
        ]
      startTransition(() => {
        setActiveIndex(
          (activeIndex - 1 + visibleValues.length) % visibleValues.length,
        )
        scrollActiveIntoView(listboxRef.current, next)
      })
    } else if (event.key === "Enter" && activeValue) {
      event.preventDefault()
      event.stopPropagation()
      const item = itemsRef.current.get(activeValue)
      if (item) {
        startTransition(() => item.onSelect())
      }
    }
  }

  const contextValue = {
    activeValue,
    filter,
    inputProps: { ...inputProps, onKeyDown: handleKeyDown },
    inputRef,
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
  }

  useLayoutEffect(() => {
    flushVisibleValues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsRef.current.size, value])

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

  const { inputRef, open } = context
  const [style, setStyle] = useState<React.CSSProperties>({})

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input || !open) return

    const rect = input.getBoundingClientRect()
    setStyle({
      position: "fixed",
      top: rect.bottom,
      left: rect.left,
      zIndex: 500,
    })
  }, [inputRef, open])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      ref={listboxRef}
      role="listbox"
      aria-label="Suggestions"
      className={cn(
        "bg-popover max-h-72 w-75 overflow-y-auto rounded-md shadow-md",
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
  "text-foreground relative mx-1 flex h-7 items-center rounded-sm px-2 text-sm outline-none select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    defaultVariants: {
      interactive: true,
    },
    variants: {
      interactive: {
        false: "",
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
  return (
    <div
      className={cn(
        "hidden py-1.5 not-last:border-b has-[[role=option]]:block",
        className,
      )}
      {...props}
    />
  )
}

export function InlineComboboxGroupLabel({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-muted-foreground mt-1.5 mb-2 px-3 text-xs font-medium",
        className,
      )}
      {...props}
    />
  )
}
