import type React from 'react'
import './AppShell.css'

type NavItem = {
  href: string
  label: string
  group?: string
}

type AppShellProps = {
  children: React.ReactNode
  title?: string
  subtitle?: string
  badge?: string
  navItems?: NavItem[]
}

const defaultNavItems: NavItem[] = [
  { href: '/home', label: 'Dashboard', group: 'Core' },
  { href: '/targets', label: 'Targets', group: 'Core' },
  { href: '/personas', label: 'Personas', group: 'Core' },
  { href: '/persona-chat', label: 'Chat', group: 'Core' },
  { href: '/persona-voice-call', label: 'Voice Call', group: 'Core' },
  { href: '/interviews', label: 'Interviews', group: 'Memory' },
  { href: '/photo-memories', label: 'Photos', group: 'Memory' },
  { href: '/storybooks', label: 'Storybooks', group: 'Memory' },
  { href: '/groups', label: 'Groups', group: 'Memory' },
  { href: '/consents', label: 'Consents', group: 'Trust' },
  { href: '/verification', label: 'Verification', group: 'Trust' },
  { href: '/reports', label: 'Reports', group: 'Trust' },
  { href: '/admin', label: 'Admin', group: 'Admin' },
]

function getGroupedNav(items: NavItem[]) {
  return items.reduce<Record<string, NavItem[]>>((groups, item) => {
    const groupName = item.group ?? 'Navigation'
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
    <aside className="app-shell__desktop-nav" aria-label="Desktop navigation">
      <a className="app-shell__desktop-brand" href="/home">Remory</a>
      {Object.entries(groups).map(([group, groupItems]) => (
        <section key={group}>
          <h2>{group}</h2>
          {groupItems.map((item) => (
            <a
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </section>
      ))}
    </aside>
  )
}

export function BottomNav({ items = defaultNavItems.slice(0, 5) }: { items?: NavItem[] }) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname

  return (
    <nav className="app-shell__bottom-nav" aria-label="Mobile navigation">
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
  return (
    <main className="app-shell">
      <DesktopNav items={navItems} />
      <div className="app-shell__main">
        <Header title={title} subtitle={subtitle} badge={badge} />
        <PageContainer>{children}</PageContainer>
      </div>
      <BottomNav items={navItems.slice(0, 5)} />
    </main>
  )
}
