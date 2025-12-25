import { serverApi } from "@/lib/orpc/server"

export default async function ExampleServerPage() {
  const examples = await serverApi.example.all({ page: 1, limit: 10 })

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="mx-auto max-w-sm rounded-md border p-4">
          {examples.items.map((example) => (
            <div key={example.id}>{example.title}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"
