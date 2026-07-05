import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/stat-card'
import { StatusBadge } from '@/components/status-badge'
import { formatNaira, platformOrders, type OrderStatus } from '@/lib/mock-data'
import { ShoppingBag, CheckCircle2, Clock, XCircle } from 'lucide-react'

const statusFilters: Array<{ label: string; value: OrderStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
]

export function OrdersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')

  const filtered = useMemo(() => {
    return platformOrders.filter((order) => {
      const matchesQuery =
        order.storeName.toLowerCase().includes(query.toLowerCase()) ||
        order.customer.toLowerCase().includes(query.toLowerCase()) ||
        order.id.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'all' || order.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  const paid = platformOrders.filter((o) => o.status === 'paid')
  const pending = platformOrders.filter((o) => o.status === 'pending')
  const failed = platformOrders.filter((o) => o.status === 'failed')
  const totalVolume = paid.reduce((sum, o) => sum + o.amount, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Order volume" value={formatNaira(totalVolume)} icon={ShoppingBag} hint="paid orders" />
        <StatCard label="Paid" value={String(paid.length)} icon={CheckCircle2} hint="completed" />
        <StatCard label="Pending" value={String(pending.length)} icon={Clock} hint="awaiting confirmation" />
        <StatCard label="Failed" value={String(failed.length)} icon={XCircle} hint="needs review" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Platform-wide orders across every store</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 sm:w-64"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus | 'all')}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{order.id}</TableCell>
                  <TableCell className="font-medium">{order.storeName}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{formatNaira(order.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.date).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No orders match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
