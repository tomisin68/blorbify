import { useState } from 'react'
import { Bell, CreditCard, Store, ShoppingBag, Cpu, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { notifications as seedNotifications, type NotificationItem } from '@/lib/mock-data'

const iconByType: Record<NotificationItem['type'], typeof Bell> = {
  billing: CreditCard,
  seller: Store,
  order: ShoppingBag,
  system: Cpu,
}

export function NotificationsPage() {
  const [items, setItems] = useState(seedNotifications)
  const unreadCount = items.filter((n) => !n.read).length

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          <Check className="size-4" />
          Mark all as read
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) => {
          const Icon = iconByType[item.type]
          return (
            <button
              key={item.id}
              onClick={() => markRead(item.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50',
                !item.read && 'bg-accent/30',
              )}
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.title}</span>
                  {!item.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
