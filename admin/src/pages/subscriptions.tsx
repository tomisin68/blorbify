import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { CreditCard, TrendingUp, AlertTriangle, Users } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  formatNaira,
  planPricing,
  revenueByMonth,
  sellers,
} from '@/lib/mock-data'

const signupsConfig = {
  signups: { label: 'New signups', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function SubscriptionsPage() {
  const activeSubs = sellers.filter((s) => s.status === 'active').length
  const pastDue = sellers.filter((s) => s.status === 'past_due')
  const trials = sellers.filter((s) => s.status === 'trial').length
  const mrr = sellers.reduce((sum, s) => sum + s.mrr, 0)

  const billing = sellers.filter((s) => s.status !== 'trial')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active subscriptions" value={String(activeSubs)} icon={CreditCard} hint="paying sellers" />
        <StatCard label="MRR" value={formatNaira(mrr)} icon={TrendingUp} trend={{ value: '+8.4%', direction: 'up' }} hint="vs last month" />
        <StatCard label="Past due" value={String(pastDue.length)} icon={AlertTriangle} hint="need follow-up" />
        <StatCard label="Trials in progress" value={String(trials)} icon={Users} hint="not yet converted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New signups</CardTitle>
            <CardDescription>Sellers who started a subscription each month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={signupsConfig} className="h-[240px] w-full">
              <BarChart data={revenueByMonth} margin={{ left: 0, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="signups" fill="var(--color-signups)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan pricing</CardTitle>
            <CardDescription>Current monthly plan tiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(planPricing).map(([plan, price]) => (
              <div key={plan} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium capitalize">{plan}</div>
                  <div className="text-xs text-muted-foreground">
                    {sellers.filter((s) => s.plan === plan).length} sellers
                  </div>
                </div>
                <Badge variant="secondary">{formatNaira(price)}/mo</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {pastDue.length > 0 && (
        <Card className="border-amber-300/50 dark:border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              Needs attention
            </CardTitle>
            <CardDescription>Sellers with failed or overdue payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount due</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastDue.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.storeName}</TableCell>
                    <TableCell className="capitalize">{seller.plan}</TableCell>
                    <TableCell>{formatNaira(seller.mrr)}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={seller.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All subscriptions</CardTitle>
          <CardDescription>Billing status for every paying or lapsed seller</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billing.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">{seller.storeName}</TableCell>
                  <TableCell className="text-muted-foreground">{seller.email}</TableCell>
                  <TableCell className="capitalize">{seller.plan}</TableCell>
                  <TableCell>{formatNaira(seller.mrr)}</TableCell>
                  <TableCell className="text-right">
                    <StatusBadge status={seller.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
