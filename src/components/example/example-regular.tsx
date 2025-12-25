"use client"

import { useQuery } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"

const Example = () => {
  const { data: examples, isError } = useQuery(
    queryApi.example.all.queryOptions({
      input: {
        page: 1,
        limit: 10,
      },
    }),
  )

  if (isError) {
    return <p>Something went wrong</p>
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="mx-auto max-w-sm rounded-md border p-4">
          {examples?.items.map((example) => (
            <div key={example.id}>{example.title}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Example
