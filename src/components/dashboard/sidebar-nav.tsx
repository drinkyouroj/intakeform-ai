'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  FileText,
  FileOutput,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/forms', label: 'Forms', icon: FileText },
  { href: '/dashboard/briefs', label: 'Briefs', icon: FileOutput },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings2 },
]

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

function NavLinks({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href)
        const linkContent = (
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <item.icon className="size-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger render={linkContent} />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          )
        }

        return <div key={item.href}>{linkContent}</div>
      })}
    </nav>
  )
}

/** Desktop sidebar — collapsible between 240px and 48px icon rail */
export function SidebarNav() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-card transition-[width] duration-200',
          collapsed ? 'w-12' : 'w-60'
        )}
      >
        {/* Logo / Brand */}
        <div
          className={cn(
            'flex h-14 items-center border-b px-3',
            collapsed ? 'justify-center' : 'gap-2'
          )}
        >
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight">
              IntakeForm.ai
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(!collapsed && 'ml-auto')}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
            <span className="sr-only">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </Button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks pathname={pathname} collapsed={collapsed} />
        </div>

        {/* Bottom: user button */}
        <Separator />
        <div
          className={cn(
            'flex items-center p-3',
            collapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <UserButton
            appearance={{
              elements: { avatarBox: 'size-7' },
            }}
          />
          {!collapsed && (
            <span className="text-xs text-muted-foreground truncate">
              Account
            </span>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

/** Mobile header with Sheet sidebar */
export function MobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Auto-close sheet on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="flex lg:hidden items-center h-14 border-b px-4 bg-card">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {/* Brand */}
          <div className="flex h-14 items-center border-b px-4">
            <span className="text-sm font-semibold tracking-tight">
              IntakeForm.ai
            </span>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-3">
            <NavLinks
              pathname={pathname}
              collapsed={false}
              onNavigate={() => setOpen(false)}
            />
          </div>

          {/* User */}
          <Separator />
          <div className="flex items-center gap-3 p-4">
            <UserButton
              appearance={{
                elements: { avatarBox: 'size-7' },
              }}
            />
            <span className="text-xs text-muted-foreground">Account</span>
          </div>
        </SheetContent>
      </Sheet>

      <span className="ml-3 text-sm font-semibold tracking-tight">
        IntakeForm.ai
      </span>
    </header>
  )
}
