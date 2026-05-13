import { AppShell } from '../../components/layout/AppShell'

type HubLink = {
  href: string
  title: string
  description: string
  badge?: string
}

function HubPage({ title, subtitle, links }: { title: string; subtitle: string; links: HubLink[] }) {
  return (
    <AppShell title={title} subtitle={subtitle} badge="서비스 메뉴">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">{title}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">이용 가능</span>
        </header>
        <section className="target-card-grid" aria-label={`${title} 메뉴`}>
          {links.map((link) => (
            <article className="target-card" key={link.href}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{link.title}</h2>
                  {link.badge && <span>{link.badge}</span>}
                </div>
                <p>{link.description}</p>
                <div className="target-form__actions">
                  <a href={link.href}>열기</a>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  )
}

export function ComplianceHubPage() {
  return (
    <HubPage
      title="동의와 관계 입증"
      subtitle="페르소나를 만들기 전에 필요한 동의와 관계 입증을 확인해요."
      links={[
        { href: '/compliance/consent', title: '동의 기록', description: '대상별 동의 상태를 확인하고 철회할 수 있어요.', badge: '이용 가능' },
        { href: '/compliance/verification', title: '관계 입증 요청', description: '증빙 자료를 제출하고 승인 상태를 확인해요.', badge: '이용 가능' },
      ]}
    />
  )
}

export function MemoriesHubPage() {
  return (
    <HubPage
      title="기억 자료"
      subtitle="사진과 인터뷰를 모아 스토리북으로 이어갈 수 있어요."
      links={[
        { href: '/memories/photos', title: '사진 기억', description: '사진으로 남긴 기억을 확인하고 관리해요.', badge: '이용 가능' },
        { href: '/memories/photos/upload', title: '사진 기억 올리기', description: '스토리북에 사용할 사진 기억을 추가해요.', badge: '이용 가능' },
        { href: '/memories/interviews', title: 'AI 인터뷰', description: '질문과 답변으로 기억을 더 자세히 남겨요.', badge: '이용 가능' },
      ]}
    />
  )
}

export function SharingHubPage() {
  return (
    <HubPage
      title="공유"
      subtitle="스토리북을 링크나 그룹으로 조심스럽게 공유해요."
      links={[
        { href: '/storybooks/share', title: '공유 링크', description: '스토리북을 볼 수 있는 공유 링크를 관리해요.', badge: '이용 가능' },
        { href: '/groups', title: '기억 그룹', description: '가족이나 가까운 사람들과 스토리북을 함께 봐요.', badge: '이용 가능' },
      ]}
    />
  )
}

export function SafetyCenterPage() {
  return (
    <HubPage
      title="안전 센터"
      subtitle="내 데이터와 서비스 이용 안전을 직접 관리할 수 있어요."
      links={[
        { href: '/safety/deletion-requests', title: '데이터 삭제 요청', description: '원하지 않는 데이터를 삭제해 달라고 요청해요.', badge: '이용 가능' },
        { href: '/safety/reports', title: '신고하기', description: '문제가 있는 콘텐츠나 이용 상황을 신고해요.', badge: '이용 가능' },
      ]}
    />
  )
}
