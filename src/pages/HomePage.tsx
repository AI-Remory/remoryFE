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

type TaskTone = 'required' | 'ready' | 'approval' | 'optional'

function TaskCard({
  title,
  description,
  href,
  actionLabel,
  tone,
}: {
  title: string
  description: string
  href: string
  actionLabel: string
  tone: TaskTone
}) {
  const toneLabel: Record<TaskTone, string> = {
    required: '필수 단계',
    ready: '준비 완료',
    approval: '승인 필요',
    optional: '선택 사항',
  }

  return (
    <article className={`dashboard-task-card dashboard-task-card--${tone}`}>
      <header className="dashboard-task-card__header">
        <h3>{title}</h3>
        <span className={`dashboard-task-badge dashboard-task-badge--${tone}`}>{toneLabel[tone]}</span>
      </header>
      <p>{description}</p>
      <div className="dashboard-task-card__actions">
        <a href={href}>{actionLabel}</a>
      </div>
    </article>
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
  const hasTarget = Boolean(latestTarget)
  const hasConsent = state.consents.some((consent) => consent.is_agreed === true || consent.is_consented === true)
  const approvedVerification = state.verifications.some((verification) => verification.status === 'APPROVED')
  const hasMedia = Boolean(latestTarget?.profile_image_path)

  const nextTasks = useMemo(() => {
    return [
      {
        title: '대상 추가하기',
        description: hasTarget ? '기억을 이어갈 대상이 이미 있어요. 필요하면 새 대상을 추가해 주세요.' : '기억을 남길 사람을 먼저 추가해 주세요.',
        href: '/targets/new',
        actionLabel: '대상 추가하기',
        tone: hasTarget ? ('ready' as const) : ('required' as const),
      },
      {
        title: '사진·음성 올리기',
        description: hasMedia ? '사진 또는 음성 자료가 준비되어 있어요.' : '스토리북과 대화를 위한 사진·음성 자료를 올려 주세요.',
        href: latestTarget ? `/targets/media?target_id=${latestTarget.id}` : '/targets/media',
        actionLabel: '사진·음성 올리기',
        tone: hasMedia ? ('ready' as const) : ('required' as const),
      },
      {
        title: '관계 입증 요청하기',
        description: approvedVerification ? '관계 입증이 승인되어 다음 단계를 진행할 수 있어요.' : '페르소나를 만들기 전에 관계 입증 상태를 확인하세요.',
        href: latestTarget ? `/compliance/verification?target_id=${latestTarget.id}` : '/compliance/verification',
        actionLabel: '관계 입증 요청하기',
        tone: approvedVerification ? ('ready' as const) : ('approval' as const),
      },
      {
        title: '동의 확인하기',
        description: hasConsent ? '필수 동의가 확인되었어요.' : '페르소나를 만들기 전에 동의 상태를 확인하세요.',
        href: latestTarget ? `/compliance/consent?target_id=${latestTarget.id}` : '/compliance/consent',
        actionLabel: '동의 확인하기',
        tone: hasConsent ? ('ready' as const) : ('required' as const),
      },
      {
        title: '페르소나 만들기',
        description: hasTarget && hasConsent && approvedVerification
          ? '필수 준비가 완료되었어요. 이제 페르소나를 만들 수 있어요.'
          : '대상, 동의, 관계 입증이 완료되면 바로 페르소나를 만들 수 있어요.',
        href: latestTarget ? `/personas?target_id=${latestTarget.id}` : '/personas',
        actionLabel: '페르소나 만들기',
        tone: hasTarget && hasConsent && approvedVerification ? ('ready' as const) : ('optional' as const),
      },
    ]
  }, [approvedVerification, hasConsent, hasMedia, hasTarget, latestTarget])

  return (
    <AppShell title="홈" subtitle="오늘 이어갈 기억을 선택해 주세요." badge="다음 할 일">
      <main className="dashboard-page">
        <section className="dashboard-header-card" aria-label="오늘의 시작">
          <div>
            <p className="dashboard-header-card__eyebrow">{state.nickname}님</p>
            <h1>오늘 이어갈 기억을 정리해 볼까요?</h1>
            <p>아래 순서대로 진행하면 페르소나와 스토리북 준비를 자연스럽게 이어갈 수 있어요.</p>
          </div>
          <a href="/targets/new">대상 추가하기</a>
        </section>

        {state.error && <p className="dashboard-error" role="alert">{state.error}</p>}

        <section className="dashboard-task-grid" aria-label="다음 할 일">
          {nextTasks.map((task) => (
            <TaskCard key={task.title} {...task} />
          ))}
        </section>

        <section className="dashboard-panel" aria-label="스토리북 재료">
          <div className="dashboard-panel__heading">
            <span>스토리북 재료</span>
            <h2>사진과 인터뷰를 모아 스토리북을 만들 수 있어요.</h2>
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
