import type { ComponentType } from 'react'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import OnboardingPage from './pages/OnboardingPage'
import { MyPage } from './pages/account/AccountPages'
import {
  AdminAuditLogsPage,
  AdminDashboardPage,
  AdminReportsPage,
  AdminVerificationReviewPage,
  AdminVoiceProfileReviewPage,
} from './pages/admin/AdminPages'
import { ConsentPage, TargetVerificationPage } from './pages/compliance/CompliancePages'
import { PersonaChatPage, PersonaVoiceCallPage } from './pages/conversations/ConversationsPages'
import { MemoryGroupDetailPage, MemoryGroupListPage } from './pages/groups/GroupsPages'
import { ComplianceHubPage, MemoriesHubPage, SafetyCenterPage, SharingHubPage } from './pages/hubs/HubPages'
import { InterviewListPage, InterviewSessionPage, PhotoMemoryListPage, PhotoMemoryUploadPage } from './pages/memories/MemoriesPages'
import { PersonaDetailPage, PersonaListPage, PersonaVoiceProfilePage } from './pages/personas/PersonasPages'
import { DeletionRequestPage, ReportPage } from './pages/safety/SafetyPages'
import { PublicSharePage, StorybookSharePage } from './pages/sharing/SharingPages'
import { StorybookCreatePage, StorybookDetailPage, StorybookListPage } from './pages/storybooks/StorybookPages'
import { TargetCreatePage, TargetDetailPage, TargetListPage, TargetMediaPage } from './pages/targets/TargetsPages'

export type RouteGroup =
  | 'public'
  | 'dashboard'
  | 'targets'
  | 'compliance'
  | 'personas'
  | 'conversations'
  | 'memories'
  | 'storybooks'
  | 'sharing'
  | 'groups'
  | 'safety'
  | 'account'
  | 'admin'

export type AppRoute = {
  path: string
  component: ComponentType
  protected?: boolean
  group: RouteGroup
  exact?: boolean
  legacy?: boolean
}

export const routes: AppRoute[] = [
  { path: '/login', component: AuthPage, group: 'public', exact: true },
  { path: '/signup', component: AuthPage, group: 'public', exact: true },
  { path: '/auth/login', component: AuthPage, group: 'public', exact: true },
  { path: '/auth/signup', component: AuthPage, group: 'public', exact: true },
  { path: '/auth', component: AuthPage, group: 'public', exact: true, legacy: true },
  { path: '/share/', component: PublicSharePage, group: 'sharing' },
  { path: '/onboarding', component: OnboardingPage, protected: true, group: 'dashboard' },
  { path: '/setup', component: OnboardingPage, protected: true, group: 'dashboard', legacy: true },
  { path: '/dashboard', component: HomePage, protected: true, group: 'dashboard' },
  { path: '/home', component: HomePage, protected: true, group: 'dashboard', legacy: true },
  { path: '/targets/new', component: TargetCreatePage, protected: true, group: 'targets' },
  { path: '/targets/detail', component: TargetDetailPage, protected: true, group: 'targets' },
  { path: '/targets/media', component: TargetMediaPage, protected: true, group: 'targets' },
  { path: '/targets', component: TargetListPage, protected: true, group: 'targets' },
  { path: '/target-media', component: TargetMediaPage, protected: true, group: 'targets', legacy: true },
  { path: '/compliance/consent', component: ConsentPage, protected: true, group: 'compliance' },
  { path: '/compliance/verification', component: TargetVerificationPage, protected: true, group: 'compliance' },
  { path: '/compliance', component: ComplianceHubPage, protected: true, group: 'compliance' },
  { path: '/consents', component: ConsentPage, protected: true, group: 'compliance', legacy: true },
  { path: '/verification', component: TargetVerificationPage, protected: true, group: 'compliance', legacy: true },
  { path: '/personas/voice-profile', component: PersonaVoiceProfilePage, protected: true, group: 'personas' },
  { path: '/personas/detail', component: PersonaDetailPage, protected: true, group: 'personas' },
  { path: '/personas', component: PersonaListPage, protected: true, group: 'personas' },
  { path: '/conversations/chat', component: PersonaChatPage, protected: true, group: 'conversations' },
  { path: '/conversations', component: PersonaChatPage, protected: true, group: 'conversations' },
  { path: '/persona-chat', component: PersonaChatPage, protected: true, group: 'conversations', legacy: true },
  { path: '/voice-call', component: PersonaVoiceCallPage, protected: true, group: 'conversations' },
  { path: '/persona-voice-call', component: PersonaVoiceCallPage, protected: true, group: 'conversations', legacy: true },
  { path: '/memories/interviews/session', component: InterviewSessionPage, protected: true, group: 'memories' },
  { path: '/memories/interviews', component: InterviewListPage, protected: true, group: 'memories' },
  { path: '/memories/photos/upload', component: PhotoMemoryUploadPage, protected: true, group: 'memories' },
  { path: '/memories/photos', component: PhotoMemoryListPage, protected: true, group: 'memories' },
  { path: '/memories', component: MemoriesHubPage, protected: true, group: 'memories' },
  { path: '/interviews/session', component: InterviewSessionPage, protected: true, group: 'memories', legacy: true },
  { path: '/interviews', component: InterviewListPage, protected: true, group: 'memories', legacy: true },
  { path: '/photo-memories/upload', component: PhotoMemoryUploadPage, protected: true, group: 'memories', legacy: true },
  { path: '/photo-memories', component: PhotoMemoryListPage, protected: true, group: 'memories', legacy: true },
  { path: '/storybooks/create', component: StorybookCreatePage, protected: true, group: 'storybooks' },
  { path: '/storybooks/detail', component: StorybookDetailPage, protected: true, group: 'storybooks' },
  { path: '/storybooks/share', component: StorybookSharePage, protected: true, group: 'sharing' },
  { path: '/storybooks', component: StorybookListPage, protected: true, group: 'storybooks' },
  { path: '/sharing', component: SharingHubPage, protected: true, group: 'sharing' },
  { path: '/groups/detail', component: MemoryGroupDetailPage, protected: true, group: 'groups' },
  { path: '/groups', component: MemoryGroupListPage, protected: true, group: 'groups' },
  { path: '/safety/deletion-requests', component: DeletionRequestPage, protected: true, group: 'safety' },
  { path: '/safety/reports', component: ReportPage, protected: true, group: 'safety' },
  { path: '/safety', component: SafetyCenterPage, protected: true, group: 'safety' },
  { path: '/deletion-requests', component: DeletionRequestPage, protected: true, group: 'safety', legacy: true },
  { path: '/reports', component: ReportPage, protected: true, group: 'safety', legacy: true },
  { path: '/account', component: MyPage, protected: true, group: 'account' },
  { path: '/my', component: MyPage, protected: true, group: 'account', legacy: true },
  { path: '/admin/verification', component: AdminVerificationReviewPage, protected: true, group: 'admin' },
  { path: '/admin/reports', component: AdminReportsPage, protected: true, group: 'admin' },
  { path: '/admin/audit-logs', component: AdminAuditLogsPage, protected: true, group: 'admin' },
  { path: '/admin/voice-profiles', component: AdminVoiceProfileReviewPage, protected: true, group: 'admin' },
  { path: '/admin', component: AdminDashboardPage, protected: true, group: 'admin' },
  { path: '/', component: LandingPage, group: 'public', exact: true },
]

export function matchRoute(pathname: string) {
  return routes.find((route) => (route.exact ? pathname === route.path : pathname.startsWith(route.path)))
}
