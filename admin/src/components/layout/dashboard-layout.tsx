import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

const titles: Record<string, string> = {
  '/': 'Overview',
  '/sellers': 'Sellers',
  '/subscriptions': 'Subscriptions & Billing',
  '/orders': 'Orders',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
}

export function DashboardLayout() {
  const location = useLocation()
  const title = titles[location.pathname] ?? 'Overview'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
