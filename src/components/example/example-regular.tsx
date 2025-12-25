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

  const { data: session, isError: isSessionError } = useQuery(
    queryApi.session.current.queryOptions(),
  )

  if (isError) {
    return <p>Something went wrong</p>
  }

  if (isSessionError) {
    return <p>Youare not authorized to view this content.</p>
  }

  return (
    <div>
      {session && (
        <div className="mb-4 text-center">
          <p className="text-lg font-medium">
            {session.id ? `Logged in as ${session.username}` : "Not logged in"}
          </p>
        </div>
      )}
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
