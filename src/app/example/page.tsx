import Link from "@/components/link"

export default function ExamplePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Link href="/example/regular" className="text-2xl underline">
        Regular
      </Link>
      <Link href="/example/infinite" className="mt-4 text-2xl underline">
        Infinite
      </Link>
      <Link href="/example/server" className="mt-4 text-2xl underline">
        Server
      </Link>
      <Link href="/example/mutation" className="mt-4 text-2xl underline">
        Mutation
      </Link>
      <Link href="/example/user" className="mt-4 text-2xl underline">
        Auth
      </Link>
    </div>
  )
}
