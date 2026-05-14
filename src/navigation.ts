export type NavGroup =
  | '홈'
  | '대상과 페르소나'
  | '기억 만들기'
  | '공유'
  | '안전 센터'
  | '계정'
  | '관리자'

export type NavItem = {
  href: string
  label: string
  group: NavGroup
  mobile?: boolean
  admin?: boolean
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: '홈', group: '홈', mobile: true },
  { href: '/targets', label: '대상 관리', group: '대상과 페르소나', mobile: true },
  { href: '/compliance', label: '동의와 관계 입증', group: '대상과 페르소나' },
  { href: '/personas', label: '페르소나', group: '대상과 페르소나' },
  { href: '/conversations', label: '대화', group: '대상과 페르소나', mobile: true },
  { href: '/voice-call', label: '음성 대화', group: '대상과 페르소나' },
  { href: '/memories', label: '기억 자료', group: '기억 만들기', mobile: true },
  { href: '/storybooks', label: '스토리북', group: '기억 만들기' },
  { href: '/sharing', label: '공유 링크', group: '공유', mobile: true },
  { href: '/groups', label: '기억 그룹', group: '공유' },
  { href: '/safety', label: '안전 센터', group: '안전 센터' },
  { href: '/account', label: '계정', group: '계정', mobile: true },
  { href: '/admin', label: '관리자', group: '관리자', admin: true },
]
