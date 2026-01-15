import {
  Circle as CircleIcon,
  Diamond as DiamondIcon,
  Hexagon as HexagonIcon,
  Square as SquareIcon,
  Triangle as TriangleIcon,
} from "lucide-react"

const Companies = () => {
  return (
    <section className="bg-card w-full border-y py-12">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <p className="text-muted-foreground mb-8 text-center text-sm font-medium tracking-wider uppercase">
          Trusted by builders at innovative companies
        </p>
        <div className="grid grid-cols-2 items-center justify-center gap-8 opacity-60 grayscale md:grid-cols-4 lg:grid-cols-5 dark:invert">
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <HexagonIcon className="h-6 w-6" /> Acme Corp
          </div>
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <DiamondIcon className="h-6 w-6" /> Vertex
          </div>
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <TriangleIcon className="h-6 w-6" /> Pyramid
          </div>
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <CircleIcon className="h-6 w-6" /> CircleAI
          </div>
          <div className="hidden items-center justify-center gap-2 text-xl font-bold lg:flex">
            <SquareIcon className="h-6 w-6" /> BoxLabs
          </div>
        </div>
      </div>
    </section>
  )
}

export default Companies
