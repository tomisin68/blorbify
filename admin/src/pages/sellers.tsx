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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { LoadingBlock, ErrorBlock } from '@/components/data-state'
import { useAsyncData } from '@/hooks/use-async-data'
import { fetchAdminSellers, fetchSubscriptionPlans, markSellerPaid, type AdminSeller } from '@/lib/api'
import { getStoreUrl } from '@/lib/config'
import { formatNaira } from '@/lib/format'
import { toast } from 'sonner'

type SellerStatusFilter = AdminSeller['status'] | 'all'

const statusFilters: Array<{ label: string; value: SellerStatusFilter }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Trial', value: 'trial' },
  { label: 'Past due', value: 'past_due' },
]

export function SellersPage() {
  const { data: sellers, loading, error, reload } = useAsyncData(fetchAdminSellers)
  const { data: plansData } = useAsyncData(fetchSubscriptionPlans)
  const plans = plansData?.plans ?? []
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SellerStatusFilter>('all')
  const [markPaidSeller, setMarkPaidSeller] = useState<AdminSeller | null>(null)
  const [markPaidPlanId, setMarkPaidPlanId] = useState('')
  const [markingPaid, setMarkingPaid] = useState(false)

  const openMarkPaidDialog = (seller: AdminSeller) => {
    setMarkPaidSeller(seller)
    setMarkPaidPlanId(seller.plan || plans[0]?.id || '')
  }

  const confirmMarkPaid = async () => {
    if (!markPaidSeller || !markPaidPlanId) return
    setMarkingPaid(true)
    try {
      await markSellerPaid(markPaidSeller.id, markPaidPlanId)
      toast.success(`${markPaidSeller.storeName} marked as paid.`)
      setMarkPaidSeller(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not mark this seller as paid.')
    } finally {
      setMarkingPaid(false)
    }
  }

  const filtered = useMemo(() => {
    return (sellers ?? []).filter((seller) => {
      const matchesQuery =
        seller.storeName.toLowerCase().includes(query.toLowerCase()) ||
        seller.ownerName.toLowerCase().includes(query.toLowerCase()) ||
        seller.email.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'all' || seller.status === status
      return matchesQuery && matchesStatus
    })
  }, [sellers, query, status])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Sellers</CardTitle>
            <CardDescription>{sellers?.length ?? 0} stores on the platform</CardDescription>
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
            <Select value={status} onValueChange={(v) => setStatus(v as SellerStatusFilter)}>
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
          {loading ? (
            <LoadingBlock rows={6} />
          ) : error ? (
            <ErrorBlock message={error} onRetry={reload} />
          ) : (
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
                      <Badge variant="secondary">{seller.planName}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={seller.status} />
                    </TableCell>
                    <TableCell>{seller.mrrNaira > 0 ? formatNaira(seller.mrrNaira) : '—'}</TableCell>
                    <TableCell>{seller.orders.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {seller.joined
                        ? new Date(seller.joined).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
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
                            <a href={getStoreUrl(seller.storeSlug)} target="_blank" rel="noreferrer">
                              <ExternalLink className="size-4" />
                              Visit store
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMarkPaidDialog(seller)}>
                            Mark as paid
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast.info(`Suspend flow for ${seller.storeName} — not wired up yet.`)}
                          >
                            Suspend seller
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
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(markPaidSeller)} onOpenChange={(open) => !open && setMarkPaidSeller(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {markPaidSeller?.storeName} as paid</DialogTitle>
            <DialogDescription>
              Manually activates a plan for this seller, bypassing Paystack checkout. Use this for billing issues or
              comped accounts — it unlocks their dashboard immediately.
            </DialogDescription>
          </DialogHeader>
          <Select value={markPaidPlanId} onValueChange={setMarkPaidPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} — {formatNaira(plan.amountNaira)}/{plan.interval}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidSeller(null)} disabled={markingPaid}>
              Cancel
            </Button>
            <Button onClick={confirmMarkPaid} disabled={!markPaidPlanId || markingPaid}>
              {markingPaid ? 'Activating…' : 'Mark as paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
