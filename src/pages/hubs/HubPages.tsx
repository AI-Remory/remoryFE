import { AppShell } from '../../components/layout/AppShell'

type HubLink = {
  href: string
  title: string
  description: string
  badge?: string
}

function HubPage({ title, subtitle, links }: { title: string; subtitle: string; links: HubLink[] }) {
  return (
    <AppShell title={title} subtitle={subtitle} badge="정보 구조">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">{title}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">백엔드 도메인</span>
        </header>
        <section className="target-card-grid" aria-label={`${title} 링크`}>
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
      title="입증과 동의"
      subtitle="페르소나 생성 전에 필요한 동의 기록과 관계 입증 요청을 관리합니다."
      links={[
        { href: '/compliance/consent', title: '동의 기록', description: '기억 대상별 동의 목록, 생성, 철회 흐름입니다.', badge: 'API 연결됨' },
        { href: '/compliance/verification', title: '관계 입증 요청', description: '증빙 자료를 제출하고 요청 상태를 확인합니다.', badge: 'API 연결됨' },
      ]}
    />
  )
}

export function MemoriesHubPage() {
  return (
    <HubPage
      title="기억 자료"
      subtitle="스토리북 생성에 사용할 사진 기억 또는 AI 인터뷰 source를 선택합니다."
      links={[
        { href: '/memories/photos', title: '사진 기억', description: '사진 기억을 업로드하고 관리합니다.', badge: 'API 연결됨' },
        { href: '/memories/photos/upload', title: '사진 기억 업로드', description: '문서화된 multipart field로 사진 기억을 만듭니다.', badge: 'API 연결됨' },
        { href: '/memories/interviews', title: 'AI 인터뷰 세션', description: '인터뷰 세션을 만들고 스토리북 source로 사용합니다.', badge: 'API 연결됨' },
      ]}
    />
  )
}

export function SharingHubPage() {
  return (
    <HubPage
      title="공유"
      subtitle="공개 링크나 기억 그룹으로 스토리북을 공유합니다."
      links={[
        { href: '/storybooks/share', title: '공유 링크', description: '스토리북 공유 링크를 생성, 조회, 비활성화합니다.', badge: 'API 연결됨' },
        { href: '/groups', title: '기억 그룹 공유', description: '그룹 멤버와 스토리북을 공유합니다.', badge: 'API 연결됨' },
      ]}
    />
  )
}

export function SafetyCenterPage() {
  return (
    <HubPage
      title="안전 센터"
      subtitle="계정과 콘텐츠 안전을 위해 삭제 요청과 신고 흐름을 모았습니다."
      links={[
        { href: '/safety/deletion-requests', title: '삭제 요청', description: '삭제 요청을 만들고, 조회하고, 취소합니다.', badge: 'API 연결됨' },
        { href: '/safety/reports', title: '신고', description: '백엔드가 지원하는 대상 유형에 대해 신고를 제출하고 추적합니다.', badge: 'API 연결됨' },
      ]}
    />
  )
}
