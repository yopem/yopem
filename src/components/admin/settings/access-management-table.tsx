"use client"

import { EditIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UserAccess {
  id: string
  name: string
  avatar?: string
  role: "owner" | "developer" | "viewer"
  permissions: string
}

interface AccessManagementTableProps {
  users: UserAccess[]
  onEdit?: (userId: string) => void
}

const roleStyles = {
  owner: "bg-foreground/10 text-foreground border-foreground/20",
  developer: "bg-background text-muted-foreground border-border",
  viewer: "bg-background text-muted-foreground border-border",
}

const AccessManagementTable = ({
  users,
  onEdit,
}: AccessManagementTableProps) => {
  return (
    <Card>
      <Table>
        <TableHeader className="bg-card/50 border-b">
          <TableRow>
            <TableHead className="px-6 py-4 text-xs font-medium uppercase">
              User
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-medium uppercase">
              Role
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-medium uppercase">
              Permissions
            </TableHead>
            <TableHead className="px-6 py-4 text-right text-xs font-medium uppercase">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-border divide-y">
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-card/50">
              <TableCell className="px-6 py-4">
                <div className="text-foreground flex items-center gap-3">
                  {user.avatar && (
                    <div
                      className="border-border h-8 w-8 rounded-full border bg-cover bg-center"
                      style={{ backgroundImage: `url(${user.avatar})` }}
                    />
                  )}
                  {user.name}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <Badge
                  variant="outline"
                  className={`capitalize ${roleStyles[user.role]}`}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground px-6 py-4">
                {user.permissions}
              </TableCell>
              <TableCell className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit?.(user.id)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  aria-label={`Edit ${user.name}`}
                >
                  <EditIcon className="size-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export default AccessManagementTable
