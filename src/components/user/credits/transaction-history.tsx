"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateOnly } from "@/lib/utils/format-date"

interface Transaction {
  id: string
  amount: string
  type: string
  description: string | null
  createdAt: Date | null
}

interface TransactionHistoryProps {
  transactions: Transaction[] | undefined
  isLoading: boolean
}

const TransactionHistory = ({
  transactions,
  isLoading,
}: TransactionHistoryProps) => {
  return (
    <div className="rounded-xl border">
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">-</TableCell>
                <TableCell className="text-muted-foreground">
                  Loading...
                </TableCell>
                <TableCell>
                  <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                    Loading
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-right">
                  -
                </TableCell>
              </TableRow>
            ))
          ) : !transactions || transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center">
                <p className="text-muted-foreground">No transactions yet</p>
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-muted-foreground">
                  {formatDateOnly(tx.createdAt) || "-"}
                </TableCell>
                <TableCell>{tx.description ?? "-"}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.type === "purchase"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tx.type === "purchase" ? "Purchase" : "Usage"}
                  </span>
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    tx.type === "purchase" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "purchase" ? "+" : "-"}
                  {Number(tx.amount).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default TransactionHistory
