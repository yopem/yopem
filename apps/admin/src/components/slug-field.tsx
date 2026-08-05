"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { queryApi } from "rpc/query"
import { Field, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { slugify, type SlugEntity } from "utils/slug"

interface SlugFieldProps {
  value: string
  onChange: (slug: string) => void
  entity: SlugEntity
  excludeId?: string
  label?: string
}

export function SlugField({
  value,
  onChange,
  entity,
  excludeId,
  label = "Slug",
}: SlugFieldProps) {
  const [querySlug, setQuerySlug] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setQuerySlug(value), 300)
    return () => clearTimeout(timeout)
  }, [value])

  const { data, isFetching } = useQuery(
    queryApi.slugs.check.queryOptions({
      input: {
        entity,
        slug: querySlug,
        ...(excludeId ? { excludeId } : {}),
      },
      enabled: querySlug !== "",
    }),
  )

  const available = data?.available

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        value={value}
        onChange={(e) => onChange(slugify(e.target.value))}
        placeholder="Auto-generated from name"
      />
      <p
        className={
          value === "" || isFetching || available === undefined
            ? "text-muted-foreground mt-1 text-xs"
            : available
              ? "mt-1 text-xs text-emerald-600"
              : "text-destructive-foreground mt-1 text-xs"
        }
      >
        {value === ""
          ? "Leave empty to auto-generate from name"
          : isFetching
            ? "Checking availability…"
            : available
              ? "Available"
              : "Already in use"}
      </p>
    </Field>
  )
}
