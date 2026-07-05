import { Area, AreaChart, CartesianGrid, Pie, PieChart, XAxis } from 'recharts'
import { Store, Wallet, ShoppingBag, Users } from 'lucide-react'
import { StatCard } from '@/components/stat-card'
import { StatusBadge } from '@/components/status-badge'
import { LoadingBlock, ErrorBlock } from '@/components/data-state'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAsyncData } from '@/hooks/use-async-data'
import { fetchAdminOrders, fetchAdminOverview, fetchAdminSellers } from '@/lib/api'
import { formatNaira } from '@/lib/format'

const revenueConfig = {
  mrr: { label: 'MRR', color: 'var(--chart-1)' },
} satisfies ChartConfig

const planConfig = {
  value: { label: 'Sellers' },
  Starter: { label: 'Starter', color: 'var(--chart-3)' },
  Growth: { label: 'Growth', color: 'var(--chart-2)' },
  Pro: { label: 'Pro', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function OverviewPage() {
  const overview = useAsyncData(fetchAdminOverview)
  const sellers = useAsyncData(fetchAdminSellers)
  const orders = useAsyncData(() => fetchAdminOrders(5))

  const recentSellers = [...(sellers.data ?? [])]
    .sort((a, b) => (a.joined ?? '') < (b.joined ?? '') ? 1 : -1)
    .slice(0, 5)

  const months = overview.data?.revenueByMonth ?? []
  const currentMonth = months[months.length - 1]
  const previousMonth = months[months.length - 2]
  const mrrTrend = currentMonth && previousMonth && previousMonth.mrr > 0
    ? ((currentMonth.mrr - previousMonth.mrr) / previousMonth.mrr) * 100
    : null

  return (
    <div className="space-y-6">
      {overview.loading ? (
        <LoadingBlock rows={1} />
      ) : overview.error || !overview.data ? (
        <ErrorBlock message={overview.error ?? 'Could not load overview.'} onRetry={overview.reload} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Monthly recurring revenue"
              value={formatNaira(overview.data.mrrNaira)}
              icon={Wallet}
              trend={mrrTrend !== null ? { value: `${mrrTrend >= 0 ? '+' : ''}${mrrTrend.toFixed(1)}%`, direction: mrrTrend >= 0 ? 'up' : 'down' } : undefined}
              hint="vs last month"
            />
            <StatCard
              label="Active sellers"
              value={String(overview.data.activeSellers)}
              icon={Store}
              hint={`${overview.data.totalSellers} total`}
            />
            <StatCard
              label="Total orders"
              value={overview.data.totalOrders.toLocaleString()}
              icon={ShoppingBag}
              hint="across all stores"
            />
            <StatCard
              label="Trial sellers"
              value={String(overview.data.trialSellers)}
              icon={Users}
              hint="not yet paying"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue growth</CardTitle>
                <CardDescription>Platform-wide subscription revenue over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={revenueConfig} className="h-[260px] w-full">
                  <AreaChart data={months} margin={{ left: 0, right: 12 }}>
                    <defs>
                      <linearGradient id="fillMrr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-mrr)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-mrr)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatNaira(Number(value))} />}
                    />
                    <Area
                      dataKey="mrr"
                      type="monotone"
                      fill="url(#fillMrr)"
                      stroke="var(--color-mrr)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan distribution</CardTitle>
                <CardDescription>Sellers by subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={planConfig} className="mx-auto aspect-square h-[220px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={overview.data.planDistribution} dataKey="value" nameKey="plan" innerRadius={50} strokeWidth={4} />
                    <ChartLegend content={<ChartLegendContent nameKey="plan" />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Newest sellers</CardTitle>
            <CardDescription>Most recently joined stores</CardDescription>
          </CardHeader>
          <CardContent>
            {sellers.loading ? (
              <LoadingBlock />
            ) : sellers.error ? (
              <ErrorBlock message={sellers.error} onRetry={sellers.reload} />
            ) : recentSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sellers yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <div className="font-medium">{seller.storeName}</div>
                        <div className="text-xs text-muted-foreground">{seller.ownerName}</div>
                      </TableCell>
                      <TableCell>{seller.planName}</TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={seller.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest transactions across all stores</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.loading ? (
              <LoadingBlock />
            ) : orders.error ? (
              <ErrorBlock message={orders.error} onRetry={orders.reload} />
            ) : (orders.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(orders.data ?? []).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.storeName}</div>
                        <div className="text-xs text-muted-foreground">{order.customer}</div>
                      </TableCell>
                      <TableCell>{formatNaira(order.amount)}</TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
