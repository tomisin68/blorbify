import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { LoadingBlock, ErrorBlock } from '@/components/data-state'
import { useAsyncData } from '@/hooks/use-async-data'
import { fetchSubscriptionPlans } from '@/lib/api'

export function SettingsPage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsyncData(fetchSubscriptionPlans)
  const plans = data?.plans ?? []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your owner account for the admin console.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value="Platform owner" disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan pricing</CardTitle>
          <CardDescription>
            Monthly price for each subscription tier (₦). Defined in the backend plan catalog — read-only here.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {loading ? (
            <div className="sm:col-span-3">
              <LoadingBlock rows={1} />
            </div>
          ) : error ? (
            <div className="sm:col-span-3">
              <ErrorBlock message={error} onRetry={reload} />
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="space-y-2">
                <Label>{plan.name}</Label>
                <Input value={plan.amountNaira} disabled />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose which alerts you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Failed payments', description: 'Get notified when a seller’s payment fails.' },
            { label: 'New seller signups', description: 'Get notified when a new store starts a trial.' },
            { label: 'Large orders', description: 'Get notified for orders above ₦50,000.' },
            { label: 'System alerts', description: 'Backend deploys, incidents, and maintenance windows.' },
          ].map((pref, i) => (
            <div key={pref.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{pref.label}</p>
                  <p className="text-sm text-muted-foreground">{pref.description}</p>
                </div>
                <Switch defaultChecked={i !== 3} />
              </div>
              {i < 3 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Irreversible platform-wide actions.</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            onClick={() => toast.error('This is a mock action — connect to backend before enabling for real.')}
          >
            Pause all subscriptions
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
