import { Bell, ShoppingBag, Mail, UserPlus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingBlock, ErrorBlock } from '@/components/data-state'
import { useAsyncData } from '@/hooks/use-async-data'
import { fetchAdminNotifications } from '@/lib/api'

const iconByType: Record<string, typeof Bell> = {
  welcome: UserPlus,
  order: ShoppingBag,
  email: Mail,
}

export function NotificationsPage() {
  const { data: notifications, loading, error, reload } = useAsyncData(() => fetchAdminNotifications(50))
  const items = notifications ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>System and order activity across the platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <LoadingBlock rows={5} />
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          items.map((item) => {
            const Icon = iconByType[item.type] ?? Bell
            return (
              <div key={item.id} className="flex w-full items-start gap-3 rounded-lg border p-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.date
                      ? new Date(item.date).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
