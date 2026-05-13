import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import {
  AdminAuditLogsPage,
  AdminDashboardPage,
  AdminReportsPage,
  AdminVerificationReviewPage,
  AdminVoiceProfileReviewPage,
  ConsentPage,
  DeletionRequestPage,
  InterviewListPage,
  InterviewSessionPage,
  MemoryGroupDetailPage,
  MemoryGroupListPage,
  PersonaChatPage,
  PersonaDetailPage,
  PersonaListPage,
  PersonaVoiceCallPage,
  PersonaVoiceProfilePage,
  PhotoMemoryListPage,
  PhotoMemoryUploadPage,
  PublicSharePage,
  ReportPage,
  StorybookCreatePage,
  StorybookDetailPage,
  StorybookListPage,
  StorybookSharePage,
  TargetCreatePage,
  TargetDetailPage,
  TargetListPage,
  TargetMediaPage,
  TargetVerificationPage,
} from './pages/DomainPages'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import MyPage from './pages/MyPage'
import OnboardingPage from './pages/OnboardingPage'
import { useAuth } from './hooks/useAuth'
import './App.css'

const protectedPaths = [
  '/onboarding',
  '/setup',
  '/home',
  '/chat',
  '/my',
  '/targets',
  '/target-media',
  '/consents',
  '/verification',
  '/personas',
  '/persona-chat',
  '/persona-voice-call',
  '/interviews',
  '/photo-memories',
  '/storybooks',
  '/groups',
  '/deletion-requests',
  '/reports',
  '/admin',
]

function App() {
  const { pathname } = window.location
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <main className="app-loading">Loading...</main>
  }

  if (pathname.startsWith('/auth') && isAuthenticated) {
    window.location.replace('/home')
    return <main className="app-loading">Loading...</main>
  }

  if (protectedPaths.some((path) => pathname.startsWith(path)) && !isAuthenticated) {
    window.location.replace('/auth')
    return <main className="app-loading">Loading...</main>
  }

  // TODO: Backend docs say admin APIs require User.role == "admin", but OpenAPI UserResponse has no role field.
  // Do not infer admin rights client-side; /admin/* endpoints return 403 for non-admin tokens.

  if (pathname.startsWith('/auth')) {
    return <AuthPage />
  }

  if (pathname.startsWith('/share/')) {
    return <PublicSharePage />
  }

  if (pathname.startsWith('/onboarding') || pathname.startsWith('/setup')) {
    return <OnboardingPage />
  }

  if (pathname.startsWith('/home')) {
    return <HomePage />
  }

  if (pathname.startsWith('/chat')) {
    return <ChatPage />
  }

  if (pathname.startsWith('/targets/new')) {
    return <TargetCreatePage />
  }

  if (pathname.startsWith('/targets/detail')) {
    return <TargetDetailPage />
  }

  if (pathname.startsWith('/target-media') || pathname.startsWith('/targets/media')) {
    return <TargetMediaPage />
  }

  if (pathname.startsWith('/targets')) {
    return <TargetListPage />
  }

  if (pathname.startsWith('/consents')) {
    return <ConsentPage />
  }

  if (pathname.startsWith('/verification')) {
    return <TargetVerificationPage />
  }

  if (pathname.startsWith('/personas/voice-profile')) {
    return <PersonaVoiceProfilePage />
  }

  if (pathname.startsWith('/personas/detail')) {
    return <PersonaDetailPage />
  }

  if (pathname.startsWith('/persona-chat')) {
    return <PersonaChatPage />
  }

  if (pathname.startsWith('/persona-voice-call')) {
    return <PersonaVoiceCallPage />
  }

  if (pathname.startsWith('/personas')) {
    return <PersonaListPage />
  }

  if (pathname.startsWith('/interviews/session')) {
    return <InterviewSessionPage />
  }

  if (pathname.startsWith('/interviews')) {
    return <InterviewListPage />
  }

  if (pathname.startsWith('/photo-memories/upload')) {
    return <PhotoMemoryUploadPage />
  }

  if (pathname.startsWith('/photo-memories')) {
    return <PhotoMemoryListPage />
  }

  if (pathname.startsWith('/storybooks/create')) {
    return <StorybookCreatePage />
  }

  if (pathname.startsWith('/storybooks/detail')) {
    return <StorybookDetailPage />
  }

  if (pathname.startsWith('/storybooks/share')) {
    return <StorybookSharePage />
  }

  if (pathname.startsWith('/storybooks')) {
    return <StorybookListPage />
  }

  if (pathname.startsWith('/groups/detail')) {
    return <MemoryGroupDetailPage />
  }

  if (pathname.startsWith('/groups')) {
    return <MemoryGroupListPage />
  }

  if (pathname.startsWith('/deletion-requests')) {
    return <DeletionRequestPage />
  }

  if (pathname.startsWith('/reports')) {
    return <ReportPage />
  }

  if (pathname.startsWith('/admin/verification')) {
    return <AdminVerificationReviewPage />
  }

  if (pathname.startsWith('/admin/reports')) {
    return <AdminReportsPage />
  }

  if (pathname.startsWith('/admin/audit-logs')) {
    return <AdminAuditLogsPage />
  }

  if (pathname.startsWith('/admin/voice-profiles')) {
    return <AdminVoiceProfileReviewPage />
  }

  if (pathname.startsWith('/admin')) {
    return <AdminDashboardPage />
  }

  if (pathname.startsWith('/my')) {
    return <MyPage />
  }

  return <LandingPage />
}

export default App
