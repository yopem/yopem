import { Card } from "@/components/ui/card"

interface ChartPlaceholderProps {
  title: string
  subtitle: string
  height?: number
}

const ChartPlaceholder = ({
  title,
  subtitle,
  height = 256,
}: ChartPlaceholderProps) => {
  return (
    <Card className="border-border bg-card flex flex-col gap-4 rounded-xl border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <h3 className="text-foreground mt-1 text-2xl font-bold tracking-tight">
            {subtitle}
          </h3>
        </div>
        <div className="border-border bg-secondary hover:bg-secondary/80 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 transition-colors">
          <span className="bg-foreground size-2 rounded-full"></span>
          <span className="text-foreground text-xs font-medium">
            Last 30 Days
          </span>
        </div>
      </div>
      <div className="relative mt-4 w-full" style={{ height: `${height}px` }}>
        <svg
          className="size-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 800 200"
        >
          <line
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
            x1="0"
            x2="800"
            y1="199"
            y2="199"
          />
          <line
            stroke="currentColor"
            className="text-border"
            strokeDasharray="4 4"
            strokeWidth="1"
            x1="0"
            x2="800"
            y1="150"
            y2="150"
          />
          <line
            stroke="currentColor"
            className="text-border"
            strokeDasharray="4 4"
            strokeWidth="1"
            x1="0"
            x2="800"
            y1="100"
            y2="100"
          />
          <line
            stroke="currentColor"
            className="text-border"
            strokeDasharray="4 4"
            strokeWidth="1"
            x1="0"
            x2="800"
            y1="50"
            y2="50"
          />
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="currentColor"
                className="text-foreground"
                stopOpacity="0.1"
              />
              <stop
                offset="100%"
                stopColor="currentColor"
                className="text-foreground"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <path
            d="M0,150 C50,140 100,160 150,120 C200,80 250,100 300,90 C350,80 400,60 450,70 C500,80 550,50 600,40 C650,30 700,60 750,50 C780,45 800,40 800,40 V200 H0 Z"
            fill="url(#chartGradient)"
          />
          <path
            d="M0,150 C50,140 100,160 150,120 C200,80 250,100 300,90 C350,80 400,60 450,70 C500,80 550,50 600,40 C650,30 700,60 750,50 C780,45 800,40 800,40"
            fill="none"
            stroke="currentColor"
            className="text-foreground"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <div className="text-muted-foreground mt-2 flex justify-between text-[10px] font-medium tracking-wider uppercase">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
    </Card>
  )
}

export default ChartPlaceholder
