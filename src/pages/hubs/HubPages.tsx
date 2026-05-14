import { AppShell } from '../../components/layout/AppShell'
import './HubPages.css'

type HubAction = {
  title: string
  description: string
  href: string
  actionLabel: string
  status?: string
}

function HubActionList({ title, description, actions, ariaLabel }: { title: string; description: string; actions: HubAction[]; ariaLabel: string }) {
  return (
    <section className="hub-section" aria-label={ariaLabel}>
      <header className="hub-section__header">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="hub-card-grid">
        {actions.map((action) => (
          <article className="hub-card" key={action.href}>
            <header className="hub-card__header">
              <h3>{action.title}</h3>
              {action.status && <span className="hub-card__badge">{action.status}</span>}
            </header>
            <p>{action.description}</p>
            <div className="hub-card__actions">
              <a href={action.href}>{action.actionLabel}</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ComplianceHubPage() {
  return (
    <AppShell title="동의와 관계 입증" subtitle="페르소나를 만들기 전에 동의와 관계 입증 상태를 확인하세요." badge="필수 단계">
      <main className="hub-page">
        <section className="hub-section hub-checklist" aria-label="준비 순서">
          <header className="hub-section__header">
            <h2>준비 순서</h2>
            <p>필수 단계를 먼저 확인하면 페르소나 준비가 빨라져요.</p>
          </header>
          <ol>
            <li><span>1</span>관계 입증 요청하기</li>
            <li><span>2</span>동의 기록 확인하기</li>
            <li><span>3</span>페르소나 만들기</li>
          </ol>
        </section>

        <HubActionList
          ariaLabel="동의와 관계 입증 기능"
          title="상태 카드"
          description="각 단계의 상태를 확인하고 필요한 작업으로 바로 이동할 수 있어요."
          actions={[
            {
              href: '/compliance/verification',
              title: '관계 입증 요청',
              description: '증빙 자료를 제출하고 승인 상태를 확인할 수 있어요.',
              actionLabel: '관계 입증 요청하기',
              status: '승인 필요',
            },
            {
              href: '/compliance/consent',
              title: '동의 기록',
              description: '대상별 동의 상태를 확인하고 필요한 동의를 저장할 수 있어요.',
              actionLabel: '동의 기록 보기',
              status: '필수 단계',
            },
          ]}
        />
      </main>
    </AppShell>
  )
}

export function MemoriesHubPage() {
  return (
    <AppShell title="기억 자료" subtitle="사진과 인터뷰를 모아 스토리북을 만들 수 있어요." badge="자료 관리">
      <main className="hub-page">
        <HubActionList
          ariaLabel="사진 기억 관리"
          title="사진 기억"
          description="사진 기억을 정리하고 필요할 때 새 사진을 올려 스토리북 재료를 준비해요."
          actions={[
            {
              href: '/memories/photos',
              title: '사진 기억',
              description: '사진으로 남긴 기억을 확인하고 관리할 수 있어요.',
              actionLabel: '사진 기억 보기',
              status: '관리 가능',
            },
            {
              href: '/memories/photos/upload',
              title: '사진 기억 올리기',
              description: '스토리북에 사용할 사진 기억을 추가해요.',
              actionLabel: '사진 올리기',
              status: '준비 완료',
            },
          ]}
        />
        <HubActionList
          ariaLabel="인터뷰 관리"
          title="인터뷰 세션"
          description="질문과 답변을 모아 스토리북 내용을 더 풍부하게 만들어요."
          actions={[
            {
              href: '/memories/interviews',
              title: 'AI 인터뷰',
              description: '진행한 인터뷰를 확인하고 새 인터뷰를 시작할 수 있어요.',
              actionLabel: '인터뷰 시작하기',
              status: '선택 사항',
            },
          ]}
        />
      </main>
    </AppShell>
  )
}

export function SharingHubPage() {
  return (
    <AppShell title="공유" subtitle="스토리북을 링크나 그룹으로 안전하게 공유해요." badge="공유 관리">
      <main className="hub-page">
        <HubActionList
          ariaLabel="공유 도구"
          title="공유 링크와 그룹"
          description="공유 방식에 맞춰 링크 또는 그룹을 선택해 관리할 수 있어요."
          actions={[
            {
              href: '/storybooks/share',
              title: '공유 링크',
              description: '스토리북 공유 링크를 만들고 만료 상태를 관리해요.',
              actionLabel: '공유 링크 관리',
              status: '관리 가능',
            },
            {
              href: '/groups',
              title: '기억 그룹',
              description: '가족이나 지인과 추억을 나눌 그룹을 관리해요.',
              actionLabel: '그룹 보기',
              status: '선택 사항',
            },
          ]}
        />
      </main>
    </AppShell>
  )
}

export function SafetyCenterPage() {
  return (
    <AppShell title="안전 센터" subtitle="내 데이터와 서비스 이용 상태를 직접 관리할 수 있어요." badge="보호 관리">
      <main className="hub-page">
        <HubActionList
          ariaLabel="데이터 보호"
          title="데이터 보호"
          description="데이터 삭제 요청 상태를 확인하고 처리 결과를 관리해요."
          actions={[
            {
              href: '/safety/deletion-requests',
              title: '데이터 삭제 요청',
              description: '필요한 데이터 삭제를 요청하고 진행 상태를 확인해요.',
              actionLabel: '삭제 요청하기',
              status: '관리 가능',
            },
          ]}
        />
        <HubActionList
          ariaLabel="신고"
          title="신고"
          description="문제가 있는 콘텐츠나 이용 사례를 신고할 수 있어요."
          actions={[
            {
              href: '/safety/reports',
              title: '신고하기',
              description: '문제 상황을 신고해 더 안전한 이용 환경을 만들어요.',
              actionLabel: '신고하기',
              status: '필수 단계',
            },
          ]}
        />
      </main>
    </AppShell>
  )
}
