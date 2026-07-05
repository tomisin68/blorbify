import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  processing: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  past_due: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  refunded: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-400',
}

const labels: Record<string, string> = {
  active: 'Active',
  paid: 'Paid',
  delivered: 'Delivered',
  trial: 'Trial',
  shipped: 'Shipped',
  pending: 'Pending',
  processing: 'Processing',
  past_due: 'Past due',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
  failed: 'Failed',
  refunded: 'Refunded',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn('border-transparent font-medium', styles[status])}>
      {labels[status] ?? status}
    </Badge>
  )
}
