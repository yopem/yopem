"use client"

import Link from "next/link"
import {
  MoreHorizontal as MoreHorizontalIcon,
  Plus as PlusIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Tool {
  id: string
  name: string
  status: string
  createdAt: string
  runs: number
}

const mockTools: Tool[] = [
  {
    id: "1",
    name: "Blog Post Generator",
    status: "Active",
    createdAt: "Jan 15, 2026",
    runs: 1247,
  },
  {
    id: "2",
    name: "Email Responder",
    status: "Draft",
    createdAt: "Jan 14, 2026",
    runs: 0,
  },
  {
    id: "3",
    name: "Social Media Manager",
    status: "Active",
    createdAt: "Jan 12, 2026",
    runs: 856,
  },
]

function ToolsPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground">
            Manage and create AI-powered tools for your workflows.
          </p>
        </div>
        <Link href="/dashboard/admin/tools/add">
          <Button>
            <PlusIcon className="size-4" />
            <span>Create Tool</span>
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Runs</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTools.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/admin/tools/edit/${tool.id}`}
                    className="font-medium hover:underline"
                  >
                    {tool.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tool.status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {tool.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tool.createdAt}
                </TableCell>
                <TableCell className="text-muted-foreground text-right">
                  {tool.runs.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ToolsPage
