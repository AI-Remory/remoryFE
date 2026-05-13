import { AppShell } from '../../components/layout/AppShell'

type HubLink = {
  href: string
  title: string
  description: string
  badge?: string
}

function HubPage({ title, subtitle, links }: { title: string; subtitle: string; links: HubLink[] }) {
  return (
    <AppShell title={title} subtitle={subtitle} badge="IA">
      <main className="domain-page target-api-page">
        <header className="domain-page__hero">
          <div>
            <span className="domain-page__eyebrow">{title}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <span className="domain-page__badge domain-page__badge--connected">Backend domains</span>
        </header>
        <section className="target-card-grid" aria-label={`${title} links`}>
          {links.map((link) => (
            <article className="target-card" key={link.href}>
              <div className="target-card__body">
                <div className="target-card__title-row">
                  <h2>{link.title}</h2>
                  {link.badge && <span>{link.badge}</span>}
                </div>
                <p>{link.description}</p>
                <div className="target-form__actions">
                  <a href={link.href}>Open</a>
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
      title="Verification & Consent"
      subtitle="Manage consent logs and target verification requests before Persona creation."
      links={[
        { href: '/compliance/consent', title: 'ConsentLog', description: 'Target consent list, creation, and revoke flow.', badge: 'API connected' },
        { href: '/compliance/verification', title: 'TargetVerificationRequest', description: 'Submit evidence and review request status.', badge: 'API connected' },
      ]}
    />
  )
}

export function MemoriesHubPage() {
  return (
    <HubPage
      title="Memories"
      subtitle="Choose PhotoMemory or AIInterviewSession as sources for StoryBook generation."
      links={[
        { href: '/memories/photos', title: 'PhotoMemory', description: 'Upload and manage photo memories.', badge: 'API connected' },
        { href: '/memories/photos/upload', title: 'Upload PhotoMemory', description: 'Create a PhotoMemory with documented multipart fields.', badge: 'API connected' },
        { href: '/memories/interviews', title: 'AIInterviewSession', description: 'Create interview sessions and use them as StoryBook sources.', badge: 'API connected' },
      ]}
    />
  )
}

export function SharingHubPage() {
  return (
    <HubPage
      title="Sharing"
      subtitle="Share StoryBooks through public links or MemoryGroups."
      links={[
        { href: '/storybooks/share', title: 'ShareLink', description: 'Create, list, and disable StoryBook share links.', badge: 'API connected' },
        { href: '/groups', title: 'MemoryGroup sharing', description: 'Share StoryBooks with group members.', badge: 'API connected' },
      ]}
    />
  )
}

export function SafetyCenterPage() {
  return (
    <HubPage
      title="Safety Center"
      subtitle="DeletionRequest and Report workflows are grouped here for account and content safety."
      links={[
        { href: '/safety/deletion-requests', title: 'DeletionRequest', description: 'Create, list, inspect, and cancel deletion requests.', badge: 'API connected' },
        { href: '/safety/reports', title: 'Report', description: 'Submit and track reports for backend-supported target types.', badge: 'API connected' },
      ]}
    />
  )
}
