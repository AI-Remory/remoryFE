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
    const groupName = item.group ?? '메뉴'
    groups[groupName] = [...(groups[groupName] ?? []), item]
    return groups
  }, {})
}

function isVisibleBadge(badge?: string) {
  if (!badge) {
    return false
  }

  return badge !== '이용 가능'
}

function useLogoutAction() {
  const { logout } = useAuth()

  return async () => {
    await logout()
    window.location.href = '/login'
  }
}

export function Header({ title, subtitle, badge }: Pick<AppShellProps, 'title' | 'subtitle' | 'badge'>) {
  const handleLogout = useLogoutAction()

  return (
    <header className="app-shell__header">
      <div>
        <a className="app-shell__brand" href="/dashboard">Remory</a>
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="app-shell__header-actions">
        {isVisibleBadge(badge) && <span className="app-shell__header-badge">{badge}</span>}
        <button className="app-shell__logout" onClick={() => void handleLogout()} type="button">
          로그아웃
        </button>
      </div>
    </header>
  )
}

export function DesktopNav({ items = defaultNavItems }: { items?: NavItem[] }) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname
  const groups = getGroupedNav(items)
  const handleLogout = useLogoutAction()

  return (
    <aside className="app-shell__desktop-nav" aria-label="데스크톱 메뉴">
      <a className="app-shell__desktop-brand" href="/dashboard">Remory</a>
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
      <div className="app-shell__desktop-footer">
        <button onClick={() => void handleLogout()} type="button">로그아웃</button>
      </div>
    </aside>
  )
}

export function BottomNav({ items = defaultNavItems.filter((item) => item.mobile) }: { items?: NavItem[] }) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname
  const handleLogout = useLogoutAction()

  return (
    <nav className="app-shell__bottom-nav" aria-label="모바일 메뉴">
      {items.map((item) => (
        <a aria-current={pathname.startsWith(item.href) ? 'page' : undefined} href={item.href} key={item.href}>
          <span aria-hidden="true">{item.label.slice(0, 1)}</span>
          {item.label}
        </a>
      ))}
      <button className="app-shell__bottom-nav-action" onClick={() => void handleLogout()} type="button">
        <span aria-hidden="true">↗</span>
        로그아웃
      </button>
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
