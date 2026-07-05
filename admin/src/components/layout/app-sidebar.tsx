import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  CreditCard,
  ShoppingCart,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'

const navItems = [
  { title: 'Overview', url: '/', icon: LayoutDashboard },
  { title: 'Sellers', url: '/sellers', icon: Store },
  { title: 'Subscriptions & Billing', url: '/subscriptions', icon: CreditCard },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Settings', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const initials = (user?.email ?? 'A')[0]?.toUpperCase()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Blorbify</span>
                  <span className="truncate text-xs text-muted-foreground">Admin console</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className={({ isActive }) =>
                        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-md p-2">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                <span className="truncate font-medium">Owner</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => logout()}
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
