export type NavItem = {
  href: string
  label: string
  group: '작업 공간' | '생성' | '보관함' | '신뢰와 안전' | '계정' | '관리자'
  mobile?: boolean
  admin?: boolean
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: '대시보드', group: '작업 공간', mobile: true },
  { href: '/targets', label: '기억 대상', group: '작업 공간', mobile: true },
  { href: '/compliance', label: '입증과 동의', group: '신뢰와 안전' },
  { href: '/personas', label: '페르소나', group: '작업 공간' },
  { href: '/conversations', label: '대화', group: '작업 공간', mobile: true },
  { href: '/voice-call', label: '음성 대화', group: '작업 공간' },
  { href: '/memories', label: '기억 자료', group: '생성', mobile: true },
  { href: '/storybooks', label: '스토리북', group: '보관함' },
  { href: '/sharing', label: '공유', group: '보관함' },
  { href: '/groups', label: '그룹', group: '보관함' },
  { href: '/safety', label: '안전 센터', group: '신뢰와 안전' },
  { href: '/account', label: '내 계정', group: '계정', mobile: true },
  { href: '/admin', label: '관리자', group: '관리자', admin: true },
]
