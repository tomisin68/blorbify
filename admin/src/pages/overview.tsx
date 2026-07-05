import { Area, AreaChart, CartesianGrid, Pie, PieChart, XAxis } from 'recharts'
import { Store, Wallet, ShoppingBag, Users } from 'lucide-react'
import { StatCard } from '@/components/stat-card'
import { StatusBadge } from '@/components/status-badge'
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
import {
  formatNaira,
  overviewStats,
  platformOrders,
  planDistribution,
  revenueByMonth,
  sellers,
} from '@/lib/mock-data'

const revenueConfig = {
  mrr: { label: 'MRR', color: 'var(--chart-1)' },
} satisfies ChartConfig

const planConfig = {
  value: { label: 'Sellers' },
  starter: { label: 'Starter', color: 'var(--chart-3)' },
  growth: { label: 'Growth', color: 'var(--chart-2)' },
  pro: { label: 'Pro', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function OverviewPage() {
  const recentSellers = [...sellers]
    .sort((a, b) => (a.joined < b.joined ? 1 : -1))
    .slice(0, 5)
  const recentOrders = platformOrders.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly recurring revenue"
          value={formatNaira(overviewStats.mrr)}
          icon={Wallet}
          trend={{ value: '+8.4%', direction: 'up' }}
          hint="vs last month"
        />
        <StatCard
          label="Active sellers"
          value={String(overviewStats.activeSellers)}
          icon={Store}
          trend={{ value: '+2', direction: 'up' }}
          hint="this month"
        />
        <StatCard
          label="Total orders"
          value={overviewStats.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          trend={{ value: '+12.1%', direction: 'up' }}
          hint="vs last month"
        />
        <StatCard
          label="Churn rate"
          value={`${overviewStats.churnRate}%`}
          icon={Users}
          trend={{ value: '-0.4%', direction: 'down' }}
          hint="vs last month"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue growth</CardTitle>
            <CardDescription>Platform-wide MRR over the last 7 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-[260px] w-full">
              <AreaChart data={revenueByMonth} margin={{ left: 0, right: 12 }}>
                <defs>
                  <linearGradient id="fillMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-mrr)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-mrr)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatNaira(Number(value))}
                    />
                  }
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
                <Pie data={planDistribution} dataKey="value" nameKey="plan" innerRadius={50} strokeWidth={4} />
                <ChartLegend content={<ChartLegendContent nameKey="plan" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Newest sellers</CardTitle>
            <CardDescription>Most recently joined stores</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <TableCell className="capitalize">{seller.plan}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={seller.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest transactions across all stores</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
