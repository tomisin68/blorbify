import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string
  icon: LucideIcon
  trend?: { value: string; direction: 'up' | 'down' }
  hint?: string
}

export function StatCard({ label, value, icon: Icon, trend, hint }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                'flex items-center gap-0.5 font-medium',
                trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
              )}
            >
              {trend.direction === 'up' ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {trend.value}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
