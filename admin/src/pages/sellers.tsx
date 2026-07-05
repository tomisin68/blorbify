import { useMemo, useState } from 'react'
import { MoreHorizontal, Search, ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { StatusBadge } from '@/components/status-badge'
import { formatNaira, sellers, type SellerStatus } from '@/lib/mock-data'
import { toast } from 'sonner'

const statusFilters: Array<{ label: string; value: SellerStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Trial', value: 'trial' },
  { label: 'Past due', value: 'past_due' },
  { label: 'Suspended', value: 'suspended' },
]

export function SellersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SellerStatus | 'all'>('all')

  const filtered = useMemo(() => {
    return sellers.filter((seller) => {
      const matchesQuery =
        seller.storeName.toLowerCase().includes(query.toLowerCase()) ||
        seller.ownerName.toLowerCase().includes(query.toLowerCase()) ||
        seller.email.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'all' || seller.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Sellers</CardTitle>
            <CardDescription>{sellers.length} stores on the platform</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search sellers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 sm:w-64"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as SellerStatus | 'all')}>
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
                <TableHead>Store</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {seller.storeName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{seller.storeName}</div>
                        <div className="text-xs text-muted-foreground">{seller.ownerName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {seller.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={seller.status} />
                  </TableCell>
                  <TableCell>{seller.mrr > 0 ? formatNaira(seller.mrr) : '—'}</TableCell>
                  <TableCell>{seller.orders.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(seller.joined).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`https://${seller.storeUrl}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" />
                            Visit store
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.info(`Suspend flow for ${seller.storeName} — wire up to backend.`)}
                        >
                          Suspend seller
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.info(`Impersonate flow for ${seller.storeName} — wire up to backend.`)}
                        >
                          Impersonate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No sellers match your filters.
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
