import type React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { navItems as defaultNavItems } from '../../navigation'
import './AppShell.css'

type NavItem = {
  href: string
  label: string
  group?: string
  mobile?: boolean
  admin?: boolean
}

type AppShellProps = {
  children: React.ReactNode
  title?: string
  subtitle?: string
  badge?: string
  navItems?: NavItem[]
}

function getGroupedNav(items: NavItem[]) {
  return items.reduce<Record<string, NavItem[]>>((groups, item) => {
    const groupName = item.group ?? '탐색'
    groups[groupName] = [...(groups[groupName] ?? []), item]
    return groups
  }, {})
}

export function Header({ title, subtitle, badge }: Pick<AppShellProps, 'title' | 'subtitle' | 'badge'>) {
  return (
    <header className="app-shell__header">
      <div>
        <a className="app-shell__brand" href="/home">Remory</a>
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {badge && <span className="app-shell__header-badge">{badge}</span>}
    </header>
  )
}

export function DesktopNav({ items = defaultNavItems }: { items?: NavItem[] }) {
  const groups = getGroupedNav(items)
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname

  return (
    <aside className="app-shell__desktop-nav" aria-label="데스크톱 메뉴">
      <a className="app-shell__desktop-brand" href="/home">Remory</a>
      {Object.entries(groups).map(([group, groupItems]) => (
        <section key={group}>
          <h2>{group}</h2>
          {groupItems.map((item) => (
            <a aria-current={pathname.startsWith(item.href) ? 'page' : undefined} href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </section>
      ))}
    </aside>
  )
}

export function BottomNav({ items = defaultNavItems.filter((item) => item.mobile) }: { items?: NavItem[] }) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname

  return (
    <nav className="app-shell__bottom-nav" aria-label="모바일 메뉴">
      {items.map((item) => (
        <a aria-current={pathname.startsWith(item.href) ? 'page' : undefined} href={item.href} key={item.href}>
          <span aria-hidden="true">{item.label.slice(0, 1)}</span>
          {item.label}
        </a>
      ))}
    </nav>
  )
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <section className="app-shell__page-container">{children}</section>
}

export function AppShell({ children, title, subtitle, badge, navItems = defaultNavItems }: AppShellProps) {
  const { isAdmin, isLoading } = useAuth()
  const visibleNavItems = isLoading || !isAdmin ? navItems.filter((item) => !item.admin) : navItems

  return (
    <main className="app-shell">
      <DesktopNav items={visibleNavItems} />
      <div className="app-shell__main">
        <Header title={title} subtitle={subtitle} badge={badge} />
        <PageContainer>{children}</PageContainer>
      </div>
      <BottomNav items={visibleNavItems.filter((item) => item.mobile)} />
    </main>
  )
}
