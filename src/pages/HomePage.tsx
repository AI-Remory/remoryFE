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
  const statusLabel = status === 'ready' ? '바로 가능' : status === 'next' ? '다음 단계' : '승인 필요'

  return (
    <a className={`dashboard-action-card dashboard-action-card--${status}`} href={href}>
      <span>{statusLabel}</span>
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
    { label: '대상 추가하기', done: hasTarget, href: '/targets/new' },
    { label: '동의 확인하기', done: hasConsent, href: target ? `/compliance/consent?target_id=${target.id}` : '/compliance/consent' },
    { label: '관계 입증 요청하기', done: approvedVerification, href: target ? `/compliance/verification?target_id=${target.id}` : '/compliance/verification' },
    { label: '사진·음성 올리기', done: Boolean(target?.profile_image_path), href: target ? `/targets/media?target_id=${target.id}` : '/targets/media' },
    { label: '페르소나 만들기', done: false, href: target ? `/personas?target_id=${target.id}` : '/personas' },
  ]

  return (
    <section className="dashboard-panel" aria-label="페르소나 준비 단계">
      <div className="dashboard-panel__heading">
        <span>페르소나 준비</span>
        <h2>페르소나를 만들기 전에 필요한 단계예요</h2>
      </div>
      <div className="dashboard-checklist">
        {items.map((item) => (
          <a className={item.done ? 'is-done' : ''} href={item.href} key={item.label}>
            <span aria-hidden="true">{item.done ? '완료' : '대기'}</span>
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
            error: error instanceof Error ? error.message : '대시보드 정보를 불러오지 못했어요.',
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
          title: '첫 대상 추가하기',
          description: '기억을 남길 사람을 먼저 추가해 주세요. 이후 동의, 관계 입증, 사진·음성을 이어서 준비할 수 있어요.',
          href: '/targets/new',
          status: 'next' as const,
        },
      ]
    }

    return [
      {
        title: '관계 입증과 동의 확인',
        description: '페르소나를 만들기 전에 필요한 승인과 동의 상태를 확인해 주세요.',
        href: `/compliance?target_id=${latestTarget.id}`,
        status: 'next' as const,
      },
      {
        title: '사진·음성 올리기',
        description: '사진이나 음성을 올리면 더 자연스러운 페르소나를 만들 수 있어요.',
        href: '/memories',
        status: 'ready' as const,
      },
      {
        title: '페르소나 만들기',
        description: '관계 입증이 승인되면 페르소나를 만들 수 있어요.',
        href: `/personas?target_id=${latestTarget.id}`,
        status: 'blocked' as const,
      },
    ]
  }, [latestTarget])

  return (
    <AppShell title="홈" subtitle={`${state.nickname}님, 오늘 이어갈 기억을 선택해 주세요.`} badge="연결됨">
      <main className="dashboard-page">
        <header className="dashboard-hero">
          <div>
            <span>다음 단계</span>
            <h1>기억을 남길 사람과 자료를 차근차근 준비해요.</h1>
            <p>대상을 추가하고 관계 입증과 동의를 마치면 페르소나와 스토리북을 만들 수 있어요.</p>
          </div>
          <a href="/targets/new">대상 추가하기</a>
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
            <span>스토리북 재료</span>
            <h2>스토리북에 담을 기억을 골라 주세요</h2>
          </div>
          <div className="dashboard-source-grid">
            <a href="/memories/photos">사진 기억 보기</a>
            <a href="/memories/interviews">인터뷰 보기</a>
            <a href="/storybooks/create">스토리북 만들기</a>
          </div>
        </section>
      </main>
    </AppShell>
  )
}

export default HomePage
