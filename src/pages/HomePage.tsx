import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { authService } from '../services/authService'
import { consentService } from '../services/consentService'
import { targetService } from '../services/targetService'
import { verificationService } from '../services/verificationService'
import type { ConsentResponse } from '../types/consent'
import type { TargetResponse } from '../types/target'
import type { VerificationRequestResponse } from '../types/verification'
import './HomePage.css'

type DashboardState = {
  nickname: string
  targets: TargetResponse[]
  consents: ConsentResponse[]
  verifications: VerificationRequestResponse[]
  error: string | null
}

function getLatestTarget(targets: TargetResponse[]) {
  return targets[0] ?? null
}

function DashboardActionCard({
  title,
  description,
  href,
  status,
}: {
  title: string
  description: string
  href: string
  status: 'ready' | 'next' | 'blocked'
}) {
  return (
    <a className={`dashboard-action-card dashboard-action-card--${status}`} href={href}>
      <span>{status === 'ready' ? '준비됨' : status === 'next' ? '다음 단계' : '준비 필요'}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </a>
  )
}

function PersonaGateChecklist({
  target,
  consents,
  verifications,
}: {
  target: TargetResponse | null
  consents: ConsentResponse[]
  verifications: VerificationRequestResponse[]
}) {
  const hasTarget = Boolean(target)
  const hasConsent = consents.some((consent) => consent.is_agreed === true || consent.is_consented === true)
  const approvedVerification = verifications.some((verification) => verification.status === 'APPROVED')

  const items = [
    { label: '기억 대상 만들기', done: hasTarget, href: '/targets/new' },
    { label: '동의 기록하기', done: hasConsent, href: target ? `/compliance/consent?target_id=${target.id}` : '/compliance/consent' },
    { label: '관계 입증 제출하기', done: approvedVerification, href: target ? `/compliance/verification?target_id=${target.id}` : '/compliance/verification' },
    { label: '사진 또는 음성 업로드하기', done: Boolean(target?.profile_image_path), href: target ? `/targets/media?target_id=${target.id}` : '/targets/media' },
    { label: '페르소나 만들기', done: false, href: target ? `/personas?target_id=${target.id}` : '/personas' },
  ]

  return (
    <section className="dashboard-panel" aria-label="페르소나 생성 체크리스트">
      <div className="dashboard-panel__heading">
        <span>페르소나 준비</span>
        <h2>페르소나 생성 전 필요한 단계</h2>
      </div>
      <div className="dashboard-checklist">
        {items.map((item) => (
          <a className={item.done ? 'is-done' : ''} href={item.href} key={item.label}>
            <span aria-hidden="true">{item.done ? '✓' : '•'}</span>
            {item.label}
          </a>
        ))}
      </div>
    </section>
  )
}

function HomePage() {
  const [state, setState] = useState<DashboardState>({
    nickname: 'Remory',
    targets: [],
    consents: [],
    verifications: [],
    error: null,
  })

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      try {
        const [user, targetsResponse] = await Promise.all([authService.me(), targetService.listTargets()])
        const latestTarget = getLatestTarget(targetsResponse.items)
        const consents = latestTarget ? await consentService.listTargetConsents(latestTarget.id) : []
        const verifications = latestTarget
          ? await verificationService.listTargetVerificationRequests(latestTarget.id)
          : { items: [], total: 0, skip: 0, limit: 20 }

        if (!ignore) {
          setState({
            nickname: user.nickname,
            targets: targetsResponse.items,
            consents,
            verifications: verifications.items,
            error: null,
          })
        }
      } catch (error) {
        if (!ignore) {
          setState((current) => ({
            ...current,
            error: error instanceof Error ? error.message : '대시보드 데이터를 불러오지 못했습니다.',
          }))
        }
      }
    }

    void loadDashboard()

    return () => {
      ignore = true
    }
  }, [])

  const latestTarget = getLatestTarget(state.targets)
  const nextActions = useMemo(() => {
    if (!latestTarget) {
      return [
        {
          title: '첫 기억 대상 추가',
          description: '입증, 동의, 미디어, 페르소나, 기억 자료를 연결하려면 먼저 기억 대상을 만들어야 합니다.',
          href: '/targets/new',
          status: 'next' as const,
        },
      ]
    }

    return [
      {
        title: '입증과 동의 확인',
        description: '페르소나 생성 전에 필요한 신뢰 요건을 확인하세요.',
        href: `/compliance?target_id=${latestTarget.id}`,
        status: 'next' as const,
      },
      {
        title: '기억 자료 업로드',
        description: '스토리북의 실제 source가 될 사진을 추가하거나 인터뷰를 시작하세요.',
        href: '/memories',
        status: 'ready' as const,
      },
      {
        title: '페르소나 만들기 또는 열기',
        description: '백엔드 gate 검사가 통과된 뒤 페르소나를 만들 수 있습니다.',
        href: `/personas?target_id=${latestTarget.id}`,
        status: 'blocked' as const,
      },
    ]
  }, [latestTarget])

  return (
    <AppShell title="대시보드" subtitle={`${state.nickname}님으로 로그인했습니다. 다음 작업은 백엔드 흐름 기준으로 정리되어 있습니다.`} badge="API 연결됨">
      <main className="dashboard-page">
        <header className="dashboard-hero">
          <div>
            <span>작업 흐름</span>
            <h1>대화를 시작하기 전에 신뢰할 수 있는 기억 흐름을 준비하세요.</h1>
            <p>기억 대상을 만들고 동의와 관계 입증을 완료한 뒤, 기억 자료를 추가해 페르소나 대화와 스토리북을 생성합니다.</p>
          </div>
          <a href="/targets/new">기억 대상 추가</a>
        </header>

        {state.error && <p className="dashboard-error" role="alert">{state.error}</p>}

        <section className="dashboard-actions" aria-label="다음 작업">
          {nextActions.map((action) => (
            <DashboardActionCard key={action.title} {...action} />
          ))}
        </section>

        <PersonaGateChecklist consents={state.consents} target={latestTarget} verifications={state.verifications} />

        <section className="dashboard-panel">
          <div className="dashboard-panel__heading">
            <span>스토리북 source</span>
            <h2>스토리북 생성 전 source를 선택하세요</h2>
          </div>
          <div className="dashboard-source-grid">
            <a href="/memories/photos">사진 기억 source</a>
            <a href="/memories/interviews">AI 인터뷰 source</a>
            <a href="/storybooks/create">스토리북 만들기</a>
          </div>
        </section>
      </main>
    </AppShell>
  )
}

export default HomePage
