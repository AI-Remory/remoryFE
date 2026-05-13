export type NavItem = {
  href: string
  label: string
  group: 'Workspace' | 'Create' | 'Library' | 'Trust' | 'Account' | 'Admin'
  mobile?: boolean
  admin?: boolean
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', group: 'Workspace', mobile: true },
  { href: '/targets', label: 'People', group: 'Workspace', mobile: true },
  { href: '/compliance', label: 'Verification & Consent', group: 'Trust' },
  { href: '/personas', label: 'Personas', group: 'Workspace' },
  { href: '/conversations', label: 'Conversations', group: 'Workspace', mobile: true },
  { href: '/voice-call', label: 'Voice Call', group: 'Workspace' },
  { href: '/memories', label: 'Memories', group: 'Create', mobile: true },
  { href: '/storybooks', label: 'Storybooks', group: 'Library' },
  { href: '/sharing', label: 'Sharing', group: 'Library' },
  { href: '/groups', label: 'Groups', group: 'Library' },
  { href: '/safety', label: 'Safety Center', group: 'Trust' },
  { href: '/account', label: 'My Account', group: 'Account', mobile: true },
  { href: '/admin', label: 'Admin', group: 'Admin', admin: true },
]
