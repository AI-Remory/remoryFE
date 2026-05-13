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
      <span>{status === 'ready' ? 'Ready' : status === 'next' ? 'Next' : 'Needs setup'}</span>
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
    { label: 'Create a Target', done: hasTarget, href: '/targets/new' },
    { label: 'Record consent', done: hasConsent, href: target ? `/compliance/consent?target_id=${target.id}` : '/compliance/consent' },
    { label: 'Submit verification', done: approvedVerification, href: target ? `/compliance/verification?target_id=${target.id}` : '/compliance/verification' },
    { label: 'Upload photo or voice media', done: Boolean(target?.profile_image_path), href: target ? `/targets/media?target_id=${target.id}` : '/targets/media' },
    { label: 'Create Persona', done: false, href: target ? `/personas?target_id=${target.id}` : '/personas' },
  ]

  return (
    <section className="dashboard-panel" aria-label="Persona creation checklist">
      <div className="dashboard-panel__heading">
        <span>Persona gate</span>
        <h2>Steps before a Persona is ready</h2>
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
            error: error instanceof Error ? error.message : 'Dashboard data could not be loaded.',
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
          title: 'Add your first person',
          description: 'Create a Target before verification, consent, media, Persona, and memories can be connected.',
          href: '/targets/new',
          status: 'next' as const,
        },
      ]
    }

    return [
      {
        title: 'Review verification and consent',
        description: 'Check the trust requirements needed before Persona creation.',
        href: `/compliance?target_id=${latestTarget.id}`,
        status: 'next' as const,
      },
      {
        title: 'Upload memories',
        description: 'Add photos or start an interview so StoryBooks have a real source.',
        href: '/memories',
        status: 'ready' as const,
      },
      {
        title: 'Create or open Persona',
        description: 'Create Persona after backend gate checks pass.',
        href: `/personas?target_id=${latestTarget.id}`,
        status: 'blocked' as const,
      },
    ]
  }, [latestTarget])

  return (
    <AppShell title="Dashboard" subtitle={`Signed in as ${state.nickname}. Your next Remory actions are grouped by backend workflow.`} badge="API connected">
      <main className="dashboard-page">
        <header className="dashboard-hero">
          <div>
            <span>Workflow</span>
            <h1>Build a verified memory flow before conversations.</h1>
            <p>Start with a person, complete consent and verification, add memories, then create Persona conversations and StoryBooks.</p>
          </div>
          <a href="/targets/new">Add Target</a>
        </header>

        {state.error && <p className="dashboard-error" role="alert">{state.error}</p>}

        <section className="dashboard-actions" aria-label="Next actions">
          {nextActions.map((action) => (
            <DashboardActionCard key={action.title} {...action} />
          ))}
        </section>

        <PersonaGateChecklist consents={state.consents} target={latestTarget} verifications={state.verifications} />

        <section className="dashboard-panel">
          <div className="dashboard-panel__heading">
            <span>StoryBook source</span>
            <h2>Choose a source before generating a StoryBook</h2>
          </div>
          <div className="dashboard-source-grid">
            <a href="/memories/photos">PhotoMemory source</a>
            <a href="/memories/interviews">AIInterviewSession source</a>
            <a href="/storybooks/create">Create StoryBook</a>
          </div>
        </section>
      </main>
    </AppShell>
  )
}

export default HomePage
